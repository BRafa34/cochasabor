import { Component, input } from '@angular/core';
const paths: Record<string, string> = {
  pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  search: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  heart:
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  arrow: 'M4 12h16 M13 5l7 7-7 7',
  back: 'M20 12H4 M11 5l-7 7 7 7',
  fork: 'M5 3v5a3 3 0 0 0 6 0V3 M8 3v18 M19 3c-4 3-4 8 0 9v9 M19 3v9',
  coffee:
    'M3 8h14v7a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8Z M17 9h2a3 3 0 0 1 0 6h-2 M6 2v3 M11 2v3 M2 23h17',
  mountain: 'M2 20L9 7l4 7 3-5 6 11H2Z M7 11l2 2 2-2 M16 9l2-6 4 7',
  compass: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z M16 8l-2 6-6 2 2-6 6-2Z',
  star: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2L7 14.2 2 9.3l6.9-1L12 2Z',
  clock: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z M12 6v6l4 2',
  user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z M4 21v-2a8 8 0 0 1 16 0v2',
  menu: 'M3 6h18 M3 12h18 M3 18h18',
  close: 'M5 5l14 14 M19 5L5 19',
  check: 'M4 12l5 5L20 6',
  camera: 'M3 6h4l2-3h6l2 3h4v15H3V6Z M16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
};
@Component({
  selector: 'app-icon',
  template:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path [attr.d]="path()" /></svg>',
  styles:
    ':host { display:inline-flex; width:1.25em; height:1.25em; flex-shrink:0; vertical-align:middle; } svg { width:100%; height:100%; }',
})
export class Icon {
  readonly name = input('pin');
  path(): string {
    return paths[this.name()] ?? paths['compass'];
  }
}
