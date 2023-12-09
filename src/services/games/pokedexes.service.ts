import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Request } from '../../model/request';
import { Pokedex } from '../../model/pokedex';

@Injectable({
  providedIn: 'root'
})
export class PokedexesService {

constructor(private httpClient: HttpClient) { }

  GetPokedex(search: string, params?: Request) {
    return this.httpClient.get<Pokedex>(`https://pokeapi.co/api/v2/pokedex/${search}`, { params: {...params} })
  }

}
