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
      height: 5, weight: 50, types: [], stats: []
    }));
    http.verify();
  });

  it('loads the regional Pokédex in one request', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    const app = fixture.componentInstance;
    expect(app.title).toBe('Hoenn Pokédex');
    expect(app.entries().map(entry => entry.speciesId)).toEqual([252, 253, 255]);
    expect(app.selected()?.name).toBe('Treecko');
    expect(dexService.GetPokedex).toHaveBeenCalledOnceWith('updated-hoenn');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Treecko');
  });

  it('filters by name and supports next/previous navigation', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await Promise.resolve();

    const app = fixture.componentInstance;
    app.next();
    expect(app.selected()?.name).toBe('Grovyle');
    app.previous();
    expect(app.selected()?.name).toBe('Treecko');
    app.search.set('torch');
    expect(app.visibleEntries().map(entry => entry.name)).toEqual(['Torchic']);
    app.search.set('255');
    expect(app.visibleEntries().map(entry => entry.name)).toEqual(['Torchic']);
  });

  it('saves favorites independently of its index filter', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await Promise.resolve();

    const app = fixture.componentInstance;
    app.toggleFavorite();
    expect(app.totalFavorites()).toBe(1);
    app.setMode('favorites');
    expect(app.visibleEntries().map(entry => entry.speciesId)).toEqual([252]);
    app.toggleFavorite();
    expect(app.visibleEntries().length).toBe(0);
  });

  it('offers a recoverable error state when the API is unavailable', async () => {
    dexService.GetPokedex.and.returnValue(throwError(() => new Error('offline')));
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    expect(fixture.componentInstance.loadError()).toBeTrue();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('CONNECTION LOST');
  });
});
