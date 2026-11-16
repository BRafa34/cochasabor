import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../shared/ui/icon/icon';
@Component({
  selector: 'app-not-found',
  imports: [RouterLink, Icon],
  template: `<div class="container missing">
    <span>404</span>
    <p class="eyebrow">NOS SALIMOS DEL CAMINO</p>
    <h1>Este rincón todavía no existe.</h1>
    <p>Pero hay muchos otros lugares que esperan por ti.</p>
    <a class="button" routerLink="/lugares">Explorar lugares<app-icon name="arrow" /></a
    ><a class="link-arrow" routerLink="/">Volver al inicio</a>
  </div>`,
  styles:
    '.missing{text-align:center;padding-block:60px 90px}.missing>span{font:italic 7rem Georgia,serif;color:#d7d8c8}.eyebrow{justify-content:center;margin-top:15px}h1{font-size:2.6rem;margin:22px 0 15px}p:not(.eyebrow){color:var(--muted);line-height:1.7}.button{margin-top:15px}.link-arrow{display:flex;justify-content:center;margin-top:15px}',
})
export class NotFound {}
