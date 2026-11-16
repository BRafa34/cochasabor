import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Icon } from '../icon/icon';
@Component({
  selector: 'app-rating',
  imports: [DecimalPipe, Icon],
  template: `@if (value() !== null) {
      <span
        ><app-icon name="star" /><strong>{{ value() | number: '1.1-1' : 'es' }}</strong
        ><span class="count"
          >de 5 · {{ count() }} {{ count() === 1 ? 'reseña' : 'reseñas' }}</span
        ></span
      >
    } @else {
      <span class="count">Sin reseñas</span>
    }`,
  styles:
    ':host { display:block; font-size:.8rem; } span { display:inline-flex; align-items:center; gap:5px; } app-icon { color:#a43f29; width:14px; height:14px; } .count { color:#626861; font-weight:400; }',
})
export class Rating {
  readonly value = input<number | null>(null);
  readonly count = input(0);
}
