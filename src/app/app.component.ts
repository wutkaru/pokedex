import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PokedexesService } from '../services/games/pokedexes.service';

type ListMode = 'all' | 'favorites';

interface DexEntry {
  number: number;
  speciesId: number;
  name: string;
  slug: string;
}

interface PokemonDetail {
  height: number;
  weight: number;
  types: { slot: number; type: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  readonly title = 'Hoenn Pokédex';
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly entries = signal<DexEntry[]>([]);
  readonly selected = signal<DexEntry | null>(null);
  readonly detail = signal<PokemonDetail | null>(null);
  readonly detailLoading = signal(false);
  readonly search = signal('');
  readonly listMode = signal<ListMode>('all');
  readonly favorites = signal<ReadonlySet<number>>(new Set<number>());

  readonly visibleEntries = computed(() => {
    const query = this.search().trim().toLowerCase();
    const favorites = this.favorites();
    return this.entries().filter(entry =>
      (this.listMode() === 'all' || favorites.has(entry.speciesId)) &&
      (!query || entry.name.toLowerCase().includes(query) ||
        String(entry.number).includes(query) ||
        String(entry.speciesId).includes(query))
    );
  });

  readonly totalFavorites = computed(() => this.favorites().size);

  private readonly dexService = inject(PokedexesService);
  private readonly http = inject(HttpClient);
  private readonly detailCache = new Map<number, PokemonDetail>();
  private requestSequence = 0;

  ngOnInit(): void {
    this.restoreFavorites();
    void this.loadPokedex();
  }

  async loadPokedex(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(false);

    try {
      const response = await firstValueFrom(this.dexService.GetPokedex('updated-hoenn'));
      const entries: DexEntry[] = response.pokemon_entries
        .map(species => {
          const speciesId = Number(species.pokemon_species.url.split('/').filter(Boolean).pop());
          return {
            number: species.entry_number,
            speciesId,
            name: this.displayName(species.pokemon_species.name),
            slug: species.pokemon_species.name
          };
        })
        .filter(entry => Number.isInteger(entry.speciesId) && entry.speciesId > 0)
        .sort((a, b) => a.number - b.number);

      if (entries.length === 0) {
        throw new Error('The Hoenn Pokédex returned no entries.');
      }

      this.entries.set(entries);

      const requestedId = typeof window !== 'undefined'
        ? Number(new URLSearchParams(window.location.search).get('pokemon'))
        : 0;
      const firstEntry = entries.find(entry => entry.speciesId === requestedId) ?? entries[0];
      this.selectPokemon(firstEntry, false);
    } catch {
      this.loadError.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  selectPokemon(entry: DexEntry, updateUrl = true): void {
    if (this.selected()?.speciesId === entry.speciesId) {
      return;
    }

    this.selected.set(entry);
    this.detail.set(null);
    this.detailLoading.set(false);

    if (updateUrl && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('pokemon', String(entry.speciesId));
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    }

    const cached = this.detailCache.get(entry.speciesId);
    const requestId = ++this.requestSequence;

    if (cached) {
      this.detail.set(cached);
    } else {
      this.detailLoading.set(true);
      void this.loadDetails(entry.speciesId, requestId);
    }

    if (typeof window !== 'undefined' && typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        const current = document.querySelector('.entry-row.is-active');
        if (current && 'scrollIntoView' in current) {
          current.scrollIntoView({
            block: 'nearest',
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
          });
        }
      });
    }
  }

  previous(): void {
    this.move(-1);
  }

  next(): void {
    this.move(1);
  }

  setSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.search.set(input.value);
  }

  setMode(mode: ListMode): void {
    this.listMode.set(mode);
  }

  clearFilters(): void {
    this.search.set('');
    this.listMode.set('all');
  }

  toggleFavorite(): void {
    const selected = this.selected();
    if (!selected) {
      return;
    }

    const updated = new Set(this.favorites());
    if (updated.has(selected.speciesId)) {
      updated.delete(selected.speciesId);
    } else {
      updated.add(selected.speciesId);
    }
    this.favorites.set(updated);

    try {
      window.localStorage.setItem('hoenn-dex-favorites', JSON.stringify(Array.from(updated)));
    } catch {
    }
  }

  isFavorite(speciesId: number): boolean {
    return this.favorites().has(speciesId);
  }

  formatNumber(value: number): string {
    return String(value).padStart(3, '0');
  }

  artworkUrl(speciesId: number): string {
    return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/' +
      speciesId + '.png';
  }

  spriteUrl(speciesId: number): string {
    return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' + speciesId + '.png';
  }

  artworkFallback(event: Event, speciesId: number): void {
    const image = event.target as HTMLImageElement;
    if (image.src.includes('/official-artwork/')) {
      image.src = this.spriteUrl(speciesId);
    } else {
      image.hidden = true;
    }
  }

  heightInMeters(): string {
    return ((this.detail()?.height ?? 0) / 10).toFixed(1) + ' m';
  }

  weightInKilos(): string {
    return ((this.detail()?.weight ?? 0) / 10).toFixed(1) + ' kg';
  }

  statLabel(name: string): string {
    const labels: Record<string, string> = {
      hp: 'HP',
      attack: 'ATK',
      defense: 'DEF',
      'special-attack': 'SP. ATK',
      'special-defense': 'SP. DEF',
      speed: 'SPD'
    };
    return labels[name] ?? name.toUpperCase();
  }

  statWidth(value: number): number {
    return Math.min(100, Math.round(value / 200 * 100));
  }

  @HostListener('window:keydown', ['$event'])
  onKeyboard(event: KeyboardEvent): void {
    const element = event.target as HTMLElement | null;
    if (element && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.isContentEditable)) {
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      this.next();
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      this.previous();
    }
  }

  private async loadDetails(speciesId: number, requestId: number): Promise<void> {
    try {
      const details = await firstValueFrom(
        this.http.get<PokemonDetail>('https://pokeapi.co/api/v2/pokemon/' + speciesId)
      );
      this.detailCache.set(speciesId, details);
      if (requestId === this.requestSequence) {
        this.detail.set(details);
      }
    } catch {
      if (requestId === this.requestSequence) {
        this.detail.set(null);
      }
    } finally {
      if (requestId === this.requestSequence) {
        this.detailLoading.set(false);
      }
    }
  }

  private move(offset: number): void {
    const list = this.visibleEntries();
    if (list.length === 0) {
      return;
    }

    const index = list.findIndex(entry => entry.speciesId === this.selected()?.speciesId);
    const nextIndex = index === -1 ? 0 : (index + offset + list.length) % list.length;
    this.selectPokemon(list[nextIndex]);
  }

  private displayName(slug: string): string {
    return slug.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  }

  private restoreFavorites(): void {
    try {
      const saved: unknown = JSON.parse(window.localStorage.getItem('hoenn-dex-favorites') ?? '[]');
      if (Array.isArray(saved)) {
        this.favorites.set(new Set(saved.filter(
          (value): value is number => typeof value === 'number' && Number.isInteger(value) && value > 0
        )));
      }
    } catch {
      this.favorites.set(new Set<number>());
    }
  }
}
