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
    window.localStorage.removeItem('hoenn-dex-favorites');

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

  it('shows the complete pixel-art grid by default without fetching details', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    const app = fixture.componentInstance;
    const view = fixture.nativeElement as HTMLElement;

    expect(app.title).toBe('Hoenn Pokédex');
    expect(app.selected()).toBeNull();
    expect(app.entries().map(entry => entry.speciesId)).toEqual([252, 253, 255]);
    expect(view.querySelectorAll('.pokemon-tile').length).toBe(3);
    expect(view.querySelectorAll('.tile-image img').length).toBe(3);
    expect(view.querySelector('.detail-screen')).toBeNull();
    expect(http.match(() => true).length).toBe(0);
    expect(dexService.GetPokedex).toHaveBeenCalledOnceWith('updated-hoenn');
  });

  it('opens a Pokémon file only after a selection, then returns to the grid', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    const app = fixture.componentInstance;
    const view = fixture.nativeElement as HTMLElement;
    (view.querySelector('.pokemon-tile') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(app.selected()?.name).toBe('Treecko');
    expect(view.querySelector('.detail-screen')).not.toBeNull();
    expect(view.querySelector('.pixel-grid')).toBeNull();
    expect(new URLSearchParams(window.location.search).get('pokemon')).toBe('252');

    const request = http.expectOne('https://pokeapi.co/api/v2/pokemon/252');
    request.flush({
      height: 5,
      weight: 50,
      types: [{ slot: 1, type: { name: 'grass' } }],
      stats: [{ base_stat: 45, stat: { name: 'hp' } }]
    });
    fixture.detectChanges();

    expect(view.textContent).toContain('grass');
    expect(view.textContent).toContain('45');

    app.closeDetail();
    fixture.detectChanges();

    expect(app.selected()).toBeNull();
    expect(view.querySelector('.pokemon-tile')).not.toBeNull();
    expect(window.location.search).not.toContain('pokemon=');
  });

  it('searches by name or number and only shows saved sprites in favorites', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await Promise.resolve();

    const app = fixture.componentInstance;
    app.search.set('torch');
    expect(app.visibleEntries().map(entry => entry.name)).toEqual(['Torchic']);
    app.search.set('255');
    expect(app.visibleEntries().map(entry => entry.name)).toEqual(['Torchic']);

    app.clearFilters();
    app.openDetail(app.entries()[0]);
    app.toggleFavorite();
    expect(app.totalFavorites()).toBe(1);
    app.closeDetail();
    app.setMode('favorites');
    expect(app.visibleEntries().map(entry => entry.speciesId)).toEqual([252]);

    app.clearFilters();
    expect(app.visibleEntries().length).toBe(3);
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
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('CONNECTION LOST');
  });
});
