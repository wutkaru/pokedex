const assert = require('node:assert/strict');
const { mkdir, writeFile } = require('node:fs/promises');
const { chromium, webkit } = require('playwright');

const baseUrl = process.env.VISUAL_BASE_URL || 'http://127.0.0.1:4173/';
const outputDir = 'visual-artifacts';
const pokemon = [
  ['treecko', 252], ['grovyle', 253], ['sceptile', 254],
  ['torchic', 255], ['combusken', 256], ['blaziken', 257],
  ['mudkip', 258], ['marshtomp', 259], ['swampert', 260],
  ['poochyena', 261], ['mightyena', 262], ['zigzagoon', 263],
  ['linoone', 264], ['ralts', 280], ['kirlia', 281], ['gardevoir', 282]
];
const dex = {
  pokemon_entries: pokemon.map(([name, id], index) => ({
    entry_number: index + 1,
    pokemon_species: { name, url: 'https://pokeapi.co/api/v2/pokemon-species/' + id + '/' }
  }))
};
const scenarios = [
  { name: 'desktop', viewport: { width: 1440, height: 900 }, isMobile: false },
  { name: 'iphone-portrait', viewport: { width: 390, height: 844 }, isMobile: true },
  { name: 'iphone-small', viewport: { width: 375, height: 667 }, isMobile: true }
];

function contains(outer, inner) {
  const margin = 2;
  return inner.x >= outer.x - margin &&
    inner.y >= outer.y - margin &&
    inner.x + inner.width <= outer.x + outer.width + margin &&
    inner.y + inner.height <= outer.y + outer.height + margin;
}

async function readLayout(page) {
  return page.evaluate(() => {
    const bounds = selector => {
      const element = document.querySelector(selector);
      if (!element) {
        throw new Error('Missing visual layer: ' + selector);
      }
      const rect = element.getBoundingClientRect();
      return {
        x: Math.round(rect.x * 10) / 10,
        y: Math.round(rect.y * 10) / 10,
        width: Math.round(rect.width * 10) / 10,
        height: Math.round(rect.height * 10) / 10
      };
    };
    return {
      viewportWidth: window.innerWidth,
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
      device: bounds('.original-device'),
      coverTop: bounds('.original-cover-top'),
      coverBottom: bounds('.original-cover-bottom'),
      emblem: bounds('.original-emblem'),
      screen: bounds('.original-screen'),
      controlFrame: bounds('.device-control-frame'),
      buttonA: bounds('.device-control-a'),
      buttonB: bounds('.device-control-b')
    };
  });
}

async function verifyScenario(browser, scenario, engine) {
  const context = await browser.newContext({
    viewport: scenario.viewport,
    deviceScaleFactor: scenario.isMobile ? 2 : 1,
    isMobile: scenario.isMobile,
    hasTouch: scenario.isMobile,
    reducedMotion: 'reduce'
  });
  const page = await context.newPage();
  const result = { engine, scenario: scenario.name, viewport: scenario.viewport };

  try {
    await page.route('**/api/v2/pokedex/updated-hoenn**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(dex) })
    );
    await page.route('**/api/v2/pokemon/*', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ height: 5, weight: 50, types: [], stats: [] })
      })
    );
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.locator('.original-device').waitFor({ state: 'visible' });
    for (const selector of ['.original-cover-top', '.original-cover-bottom', '.original-emblem']) {
      await page.locator(selector).evaluate(image => image.decode());
    }

    result.intro = await readLayout(page);
    assert.equal(result.intro.horizontalOverflow, 0, 'Intro has horizontal overflow');
    for (const part of ['coverTop', 'coverBottom', 'emblem', 'screen', 'controlFrame']) {
      assert.ok(contains(result.intro.device, result.intro[part]), part + ' exceeds the device bounds');
    }
    assert.ok(contains(result.intro.controlFrame, result.intro.buttonA), 'A is outside the inner frame');
    assert.ok(contains(result.intro.controlFrame, result.intro.buttonB), 'B is outside the inner frame');
    await page.screenshot({ path: outputDir + '/' + engine + '-' + scenario.name + '-intro.png', fullPage: true });

    if (scenario.isMobile) {
      await page.locator('.device-control-a').tap();
    } else {
      await page.locator('.device-control-a').click();
    }
    await page.locator('.dex-collection').waitFor({ state: 'visible' });
    await page.locator('.pokemon-tile').first().waitFor({ state: 'visible' });
    result.archive = await readLayout(page);
    assert.equal(result.archive.horizontalOverflow, 0, 'Archive has horizontal overflow');
    assert.equal(await page.locator('.pokemon-tile').count(), pokemon.length);
    await page.waitForFunction(() => {
      const images = Array.from(document.querySelectorAll('.pokemon-tile img'));
      return images.filter(image => image.complete && image.naturalWidth > 0).length >= 12;
    }, null, { timeout: 30000 });
    result.archiveIconsLoaded = await page.locator('.pokemon-tile img').evaluateAll(images =>
      images.filter(image => image.complete && image.naturalWidth > 0).length
    );
    await page.screenshot({ path: outputDir + '/' + engine + '-' + scenario.name + '-archive.png', fullPage: true });

    if (scenario.isMobile) {
      await page.locator('.pokemon-tile').first().tap();
    } else {
      await page.locator('.pokemon-tile').first().click();
    }
    await page.locator('.detail-screen').waitFor({ state: 'visible' });
    await page.locator('.detail-sprite-stage img').evaluate(image => image.decode());
    result.detailSpriteLoaded = await page.locator('.detail-sprite-stage img')
      .evaluate(image => image.naturalWidth > 0);
    assert.equal(result.detailSpriteLoaded, true, 'Pokémon detail sprite must load');
    await page.screenshot({ path: outputDir + '/' + engine + '-' + scenario.name + '-detail.png', fullPage: true });
    if (scenario.isMobile) {
      await page.locator('.screen-back').tap();
    } else {
      await page.keyboard.press('Escape');
    }
    await page.locator('.detail-screen').waitFor({ state: 'hidden' });

    if (scenario.isMobile) {
      await page.locator('.device-control-b').tap();
    } else {
      await page.locator('.device-control-b').click();
    }
    await page.locator('.pokedex-app.intro-mode').waitFor({ state: 'visible' });
    assert.equal(await page.locator('.dex-collection').count(), 0);
    result.controls = 'A opens, detail opens and closes, B returns to intro using device-appropriate input';
    return result;
  } catch (error) {
    await page.screenshot({
      path: outputDir + '/' + engine + '-' + scenario.name + '-failure.png',
      fullPage: true
    }).catch(() => {});
    throw error;
  } finally {
    await context.close();
  }
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  const results = [];
  try {
    for (const [engine, browserType] of [['chromium', chromium], ['webkit', webkit]]) {
      const browser = await browserType.launch({ headless: true });
      try {
        for (const scenario of scenarios) {
          if (engine === 'webkit' && !scenario.isMobile) {
            continue;
          }
          results.push(await verifyScenario(browser, scenario, engine));
        }
      } finally {
        await browser.close();
      }
    }
  } finally {
    await writeFile(outputDir + '/measurements.json', JSON.stringify(results, null, 2) + '\n');
  }
  process.stdout.write('Visual review captured ' + results.length + ' browser and viewport combinations.\n');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
