import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Pokemon } from '../model/pokemon';
import { Response } from '../model/response';

@Injectable({
  providedIn: 'root'
})
export class PokemonService {

constructor(private httpClient: HttpClient) { }

  getPokemon(search: string) {
    return this.httpClient.get<Response<Pokemon>>(`https://pokeapi.co/api/v2/pokemon/${search}`)
  }
}
