import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Pokedex } from '../model/pokedex';
import { PokedexesService } from '../services/games/pokedexes.service';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let dexService: jasmine.SpyObj<PokedexesService>;
  let http: HttpTestingController;

  beforeEach(async () => {
    dexService = jasmine.createSpyObj<PokedexesService>('PokedexesService', ['GetPokedex']);
    dexService.GetPokedex.and.returnValue(of({
      pokemon_entries: [
        { entry_number: 1, pokemon_species: { name: 'treecko', url: 'https://pokeapi.co/api/v2/pokemon-species/252/' } },
        { entry_number: 2, pokemon_species: { name: 'grovyle', url: 'https://pokeapi.co/api/v2/pokemon-species/253/' } },
        { entry_number: 4, pokemon_species: { name: 'torchic', url: 'https://pokeapi.co/api/v2/pokemon-species/255/' } }
      ]
    } as Pokedex));

    window.history.replaceState({}, '', window.location.pathname);

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PokedexesService, useValue: dexService }
      ]
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.match(() => true).forEach(request => request.flush({
      height: 5,
      weight: 50,
      types: [],
      stats: []
    }));
    http.verify();
    window.history.replaceState({}, '', window.location.pathname);
  });

  it('shows only the centered ORAS device on initial load, without mounting any Pokémon tiles', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    const app = fixture.componentInstance;
    const view = fixture.nativeElement as HTMLElement;

    expect(app.title).toBe('Hoenn Pokédex');
    expect(app.selected()).toBeNull();
    expect(app.entries().map(entry => entry.speciesId)).toEqual([252, 253, 255]);
    expect(app.collectionOpened()).toBeFalse();
    expect(view.querySelector('.pokedex-app')?.classList.contains('intro-mode')).toBeTrue();
    expect(view.querySelector('.site-header')).toBeNull();
    expect(view.querySelector('.dex-collection')).toBeNull();
    expect(view.querySelector('.page-footer')).toBeNull();
    expect(view.querySelectorAll('.pokemon-tile').length).toBe(0);
    const covers = Array.from(view.querySelectorAll<HTMLImageElement>('.original-cover'));
    expect(covers.length).toBe(2);
    expect(covers[0].getAttribute('src')).toBe('assets/pokedex_cover_top.png');
    expect(covers[1].getAttribute('src')).toBe('assets/pokedex_cover_bottom.png');
    expect(view.querySelector<HTMLImageElement>('.original-emblem')?.getAttribute('src'))
      .toBe('assets/pokedex_dpad.png');
    expect(view.querySelector<HTMLImageElement>('.original-screen-logo')?.getAttribute('src'))
      .toBe('assets/cw_pokedex.png');
    expect(view.querySelector('.oras-silhouette')).toBeNull();
    expect(view.querySelectorAll('.original-screen-button').length).toBe(1);
    expect(view.querySelector('.detail-screen')).toBeNull();
    expect(view.querySelector('.original-power-indicator')).not.toBeNull();
    expect(view.querySelector('.power-light')).not.toBeNull();
    expect(view.querySelector('.power-caption')).toBeNull();
    expect(view.querySelector('.device-inner-layer')).not.toBeNull();
    expect(view.querySelectorAll('.device-control').length).toBe(2);
    expect((view.querySelector('.device-control-b') as HTMLButtonElement).disabled).toBeTrue();
    expect(view.querySelector('.mode-tabs')).toBeNull();
    expect(http.match(() => true).length).toBe(0);
    expect(dexService.GetPokedex).toHaveBeenCalledOnceWith('updated-hoenn');
  });

  it('reveals the Pokémon archive only when the original LCD is activated', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    const app = fixture.componentInstance;
    const view = fixture.nativeElement as HTMLElement;
    const shortcut = view.querySelector<HTMLButtonElement>('.original-screen-button');
    expect(shortcut).not.toBeNull();
    expect(view.querySelector('.dex-collection')).toBeNull();
    shortcut!.click();
    fixture.detectChanges();
    expect(app.collectionOpened()).toBeTrue();
    expect(app.selected()).toBeNull();
    expect(view.querySelector('.site-header')).not.toBeNull();
    expect(view.querySelector('.page-footer')).not.toBeNull();
    expect(view.querySelector('.pokedex-app')?.classList.contains('browser-mode')).toBeTrue();
    expect(view.querySelectorAll('.pokemon-tile').length).toBe(3);
    const firstIcon = view.querySelector('.pokemon-tile img') as HTMLImageElement;
    expect(firstIcon.getAttribute('src')).toContain('/generation-vii/icons/252.png');
    expect(firstIcon.getAttribute('width')).toBe('40');
    expect(firstIcon.getAttribute('height')).toBe('32');
  });

  it('uses A to open the archive and B to return to the centered device', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    const app = fixture.componentInstance;
    const view = fixture.nativeElement as HTMLElement;
    const a = view.querySelector('.device-control-a') as HTMLButtonElement;
    const b = view.querySelector('.device-control-b') as HTMLButtonElement;

    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
    expect(b.disabled).toBeTrue();
    a.click();
    fixture.detectChanges();

    expect(app.collectionOpened()).toBeTrue();
    expect(view.querySelectorAll('.pokemon-tile').length).toBe(3);
    expect(b.disabled).toBeFalse();

    b.click();
    fixture.detectChanges();
    expect(app.collectionOpened()).toBeFalse();
    expect(view.querySelector('.dex-collection')).toBeNull();
    expect(view.querySelector('.pokedex-app')?.classList.contains('intro-mode')).toBeTrue();
  });

  it('moves focus between menu icons using directional keys without opening details', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    const app = fixture.componentInstance;
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.device-control-a')!.click();
    fixture.detectChanges();

    const tiles = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.pokemon-tile'));
    tiles[0].focus();
    const key = (name: string) => {
      const event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true });
      tiles[0].dispatchEvent(event);
      fixture.detectChanges();
    };

    key('ArrowRight');
    expect(document.activeElement).toBe(tiles[1]);
    expect(app.selected()).toBeNull();
    key('ArrowLeft');
    expect(document.activeElement).toBe(tiles[0]);
    key('ArrowDown');
    expect(document.activeElement).toBe(tiles[2]);
    expect(app.selected()).toBeNull();
    expect(new URLSearchParams(window.location.search).has('pokemon')).toBeFalse();
  });

  it('opens a Pokémon file only after a selection, then returns to the grid', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    const app = fixture.componentInstance;
    const view = fixture.nativeElement as HTMLElement;
    (view.querySelector('.original-screen-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    (view.querySelector('.pokemon-tile') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(app.selected()?.name).toBe('Treecko');
    expect(view.querySelector('.detail-screen')).not.toBeNull();
    expect(view.querySelector('.pixel-grid')).not.toBeNull();
    expect(view.querySelector('.dex-collection')?.getAttribute('inert')).toBe('');
    expect(new URLSearchParams(window.location.search).get('pokemon')).toBe('252');

    const request = http.expectOne('https://pokeapi.co/api/v2/pokemon/252');
    request.flush({
      height: 5,
      weight: 50,
      types: [{ slot: 1, type: { name: 'grass' } }],
      stats: [{ base_stat: 45, stat: { name: 'hp' } }]
    });
    expect(fixture.componentInstance.detail()).toBeTruthy();
    fixture.detectChanges();
    expect(view.textContent).toContain('grass');
    expect(view.textContent).toContain('45');

    app.closeDetail();
    fixture.detectChanges();

    expect(app.selected()).toBeNull();
    expect(view.querySelector('.pokemon-tile')).not.toBeNull();
    expect(view.querySelector('.detail-screen')).toBeNull();
    expect(window.location.search).not.toContain('pokemon=');
  });

  it('searches by regional or national number without save controls', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await Promise.resolve();

    const app = fixture.componentInstance;
    app.search.set('torch');
    expect(app.visibleEntries().map(entry => entry.name)).toEqual(['Torchic']);
    app.search.set('255');
    expect(app.visibleEntries().map(entry => entry.name)).toEqual(['Torchic']);

    app.clearFilters();
    expect(app.visibleEntries().length).toBe(3);
    app.openCollection();
    app.openDetail(app.entries()[0]);
    fixture.detectChanges();
    const view = fixture.nativeElement as HTMLElement;
    expect(view.querySelector('.save-button')).toBeNull();
    expect(view.querySelector('.tile-star')).toBeNull();
    expect(view.textContent).not.toContain('SAVE POKÉMON');
    app.closeDetail();
  });

  it('moves between Pokémon within detail view and respects browser navigation', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await Promise.resolve();

    const app = fixture.componentInstance;
    app.openDetail(app.entries()[0]);
    app.next();

    expect(app.selected()?.name).toBe('Grovyle');
    expect(new URLSearchParams(window.location.search).get('pokemon')).toBe('253');

    app.previous();
    expect(app.selected()?.name).toBe('Treecko');

    window.history.replaceState({}, '', window.location.pathname);
    app.onPopState();
    expect(app.selected()).toBeNull();
  });

  it('renders a retry state if the index cannot be fetched', async () => {
    dexService.GetPokedex.and.returnValue(throwError(() => new Error('offline')));
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    expect(fixture.componentInstance.loadError()).toBeTrue();
    const view = fixture.nativeElement as HTMLElement;
    expect(view.textContent).not.toContain('CONNECTION LOST');
    (view.querySelector('.original-screen-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(view.textContent).toContain('CONNECTION LOST');
  });
});
