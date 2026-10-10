import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy, Component, ElementRef, HostListener, ViewChild,
  computed, inject, signal
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PokedexesService } from '../services/games/pokedexes.service';

interface DexEntry {
  number: number;
  speciesId: number;
  name: string;
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
  @ViewChild('spriteScroll') private spriteScroll?: ElementRef<HTMLElement>;
  @ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('closeButton') private closeButton?: ElementRef<HTMLButtonElement>;

  readonly title = 'Hoenn Pokédex';
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly entries = signal<DexEntry[]>([]);
  readonly selected = signal<DexEntry | null>(null);
  readonly detail = signal<PokemonDetail | null>(null);
  readonly detailLoading = signal(false);
  readonly detailError = signal(false);
  readonly search = signal('');

  readonly visibleEntries = computed(() => {
    const query = this.search().trim().toLowerCase();
    return this.entries().filter(entry =>
      (!query ||
        entry.name.toLowerCase().includes(query) ||
        String(entry.number).includes(query) ||
        String(entry.speciesId).includes(query))
    );
  });

  private readonly dexService = inject(PokedexesService);
  private readonly http = inject(HttpClient);
  private readonly detailCache = new Map<number, PokemonDetail>();
  private requestSequence = 0;
  private savedScrollTop = 0;
  private lastOpenedSpeciesId: number | null = null;

  ngOnInit(): void {
    void this.loadPokedex();
  }

  async loadPokedex(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(false);

    try {
      const response = await firstValueFrom(this.dexService.GetPokedex('updated-hoenn'));
      const entries: DexEntry[] = response.pokemon_entries
        .map(species => ({
          number: species.entry_number,
          speciesId: Number(species.pokemon_species.url.split('/').filter(Boolean).pop()),
          name: this.displayName(species.pokemon_species.name)
        }))
        .filter(entry => Number.isInteger(entry.speciesId) && entry.speciesId > 0)
        .sort((a, b) => a.number - b.number);

      if (entries.length === 0) {
        throw new Error('No regional Pokémon were returned.');
      }

      this.entries.set(entries);
      this.syncSelectionFromUrl(entries);
    } catch {
      this.loadError.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  openDetail(entry: DexEntry): void {
    this.lastOpenedSpeciesId = entry.speciesId;
    this.savedScrollTop = this.spriteScroll?.nativeElement.scrollTop ?? this.savedScrollTop;
    const url = new URL(window.location.href);
    url.searchParams.set('pokemon', String(entry.speciesId));
    window.history.pushState({}, '', url.pathname + url.search + url.hash);
    this.selectDetail(entry);
    requestAnimationFrame(() => this.closeButton?.nativeElement.focus());
  }

  closeDetail(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete('pokemon');
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    this.returnToGrid();
  }

  @HostListener('window:popstate')
  onPopState(): void {
    this.syncSelectionFromUrl(this.entries());
  }

  previous(): void {
    this.navigate(-1);
  }

  next(): void {
    this.navigate(1);
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.resetGridScroll();
  }

  clearFilters(): void {
    this.search.set('');
    this.resetGridScroll();
  }

  formatNumber(value: number): string {
    return String(value).padStart(3, '0');
  }

  focusFirstIcon(): void {
    const first = this.spriteScroll?.nativeElement.querySelector<HTMLButtonElement>('.pokemon-tile');
    first?.focus({ preventScroll: true });
    first?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'nearest'
    });
  }

  focusSearch(): void {
    if (this.selected()) {
      this.closeDetail();
      requestAnimationFrame(() => this.searchInput?.nativeElement.focus());
    } else {
      this.searchInput?.nativeElement.focus();
    }
  }

  iconUrl(speciesId: number): string {
    return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' +
      'versions/generation-vii/icons/' + speciesId + '.png';
  }

  iconFallback(event: Event, speciesId: number): void {
    const image = event.target as HTMLImageElement;
    if (image.src.includes('/generation-vii/icons/')) {
      image.src = this.spriteUrl(speciesId);
    } else {
      image.hidden = true;
    }
  }

  spriteUrl(speciesId: number): string {
    return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' +
      'versions/generation-iii/emerald/' + speciesId + '.png';
  }

  spriteFallback(event: Event, speciesId: number): void {
    const image = event.target as HTMLImageElement;
    if (image.src.includes('/generation-iii/')) {
      image.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' +
        speciesId + '.png';
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

  retryDetail(): void {
    const pokemon = this.selected();
    if (pokemon) {
      void this.fetchDetail(pokemon.speciesId, ++this.requestSequence);
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeyboard(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      if (event.key === 'Escape') {
        target.blur();
      }
      return;
    }

    if (event.key === 'Escape' && this.selected()) {
      event.preventDefault();
      this.closeDetail();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.previous();
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.next();
    }
  }

  private navigate(offset: number): void {
    const list = this.visibleEntries();
    if (list.length === 0) {
      return;
    }

    if (!this.selected()) {
      const container = this.spriteScroll?.nativeElement;
      if (container) {
        container.scrollBy({
          top: offset * Math.max(container.clientHeight * 0.65, 150),
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
        });
      }
      return;
    }

    const index = list.findIndex(entry => entry.speciesId === this.selected()?.speciesId);
    const nextIndex = index === -1 ? 0 : (index + offset + list.length) % list.length;
    const entry = list[nextIndex];
    const url = new URL(window.location.href);
    url.searchParams.set('pokemon', String(entry.speciesId));
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    this.selectDetail(entry);
  }

  private selectDetail(entry: DexEntry): void {
    if (this.selected()?.speciesId === entry.speciesId) {
      return;
    }

    this.selected.set(entry);
    this.detail.set(null);
    this.detailError.set(false);

    const requestId = ++this.requestSequence;
    const cached = this.detailCache.get(entry.speciesId);

    if (cached) {
      this.detailLoading.set(false);
      this.detail.set(cached);
    } else {
      void this.fetchDetail(entry.speciesId, requestId);
    }
  }

  private fetchDetail(speciesId: number, requestId: number): void {
    this.detailLoading.set(true);
    this.detailError.set(false);

    this.http.get<PokemonDetail>('https://pokeapi.co/api/v2/pokemon/' + speciesId)
      .subscribe({
        next: response => {
          this.detailCache.set(speciesId, response);
          if (requestId === this.requestSequence) {
            this.detail.set(response);
            this.detailLoading.set(false);
          }
        },
        error: () => {
          if (requestId === this.requestSequence) {
            this.detailError.set(true);
            this.detailLoading.set(false);
          }
        }
      });
  }

  private syncSelectionFromUrl(entries: DexEntry[]): void {
    const id = Number(new URLSearchParams(window.location.search).get('pokemon'));
    const matched = id > 0 ? entries.find(entry => entry.speciesId === id) : undefined;

    if (matched) {
      this.selectDetail(matched);
    } else if (this.selected()) {
      this.returnToGrid();
    }
  }

  private returnToGrid(): void {
    ++this.requestSequence;
    this.selected.set(null);
    this.detail.set(null);
    this.detailLoading.set(false);
    this.detailError.set(false);
    requestAnimationFrame(() => {
      if (this.spriteScroll) {
        this.spriteScroll.nativeElement.scrollTop = this.savedScrollTop;
      }
      if (this.lastOpenedSpeciesId !== null) {
        const tile = this.spriteScroll?.nativeElement.querySelector<HTMLButtonElement>(
          '.pokemon-tile[data-species-id="' + this.lastOpenedSpeciesId + '"]'
        );
        tile?.focus({ preventScroll: true });
      }
    });
  }

  private resetGridScroll(): void {
    this.savedScrollTop = 0;
    if (this.spriteScroll) {
      this.spriteScroll.nativeElement.scrollTop = 0;
    }
  }

  private displayName(name: string): string {
    return name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  }
}
