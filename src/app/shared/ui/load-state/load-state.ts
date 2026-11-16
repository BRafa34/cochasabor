import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../icon/icon';
@Component({
  selector: 'app-load-state',
  imports: [Icon, RouterLink],
  template: `
    @if (loading()) {
      <div class="state" role="status">
        <span class="spinner"></span>
        <h2>Preparando tu próxima salida…</h2>
        <p>Estamos cargando los lugares.</p>
      </div>
    } @else if (error()) {
      <div class="state" role="alert">
        <app-icon name="compass" />
        <h2>Hagamos otro intento</h2>
        <p>{{ error() }}</p>
        <button class="button" (click)="retry.emit()">Volver a intentar</button>
      </div>
    } @else if (empty()) {
      <div class="state">
        <app-icon name="search" />
        <h2>{{ heading() }}</h2>
        <p>{{ message() }}</p>
        @if (clearable()) {
          <button class="button" (click)="clear.emit()">Limpiar filtros</button>
        } @else {
          <a class="button" routerLink="/lugares">Explorar lugares</a>
        }
      </div>
    }
  `,
  styles:
    '.state { text-align:center; padding:64px 20px; border:1px dashed #d8d3c9; border-radius:16px; } h2 { font-size:1.7rem; margin:18px 0 10px; } p { color:#626861; } app-icon { width:40px; height:40px; color:var(--terracotta); } .spinner { display:inline-block; width:30px; height:30px; border:3px solid #ded8ca; border-top-color:var(--terracotta); border-radius:50%; animation:spin 1s linear infinite; } @keyframes spin { to { transform:rotate(360deg); } } @media(prefers-reduced-motion:reduce) { .spinner { animation:none; } }',
})
export class LoadState {
  readonly loading = input(false);
  readonly error = input('');
  readonly empty = input(false);
  readonly heading = input('No encontramos lugares con estos filtros');
  readonly message = input('Prueba otra búsqueda. Hay mucho por descubrir.');
  readonly clearable = input(false);
  readonly retry = output<void>();
  readonly clear = output<void>();
}
