import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { PokemonService } from '../services/pokemon.service';
import { Observable, catchError, combineLatest, combineLatestWith, firstValueFrom, forkJoin, mergeMap, switchMap, tap, throwError } from 'rxjs';
import { Pokemon } from '../model/pokemon';
import { Response } from '../model/response';
import { PokedexesService } from '../services/games/pokedexes.service';
import { PokemonEntry } from '../model/pokedex';
import { HttpService } from '../services/http.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'pokedex';
  data: any[] = [];

  constructor(private pokemonService: PokemonService, private pokedexesService: PokedexesService, private httpSerivce: HttpService) {}

  async ngOnInit() {
    const pokedex = await firstValueFrom(this.pokedexesService.GetPokedex('updated-hoenn'))
    for (const pokemon of pokedex.pokemon_entries) {
      const data = pokemon.pokemon_species.url.split('/');
      const id = data[data.length - 2];
      this.data.push(await firstValueFrom(this.pokemonService.getPokemon(id)))
    }
  }
}
