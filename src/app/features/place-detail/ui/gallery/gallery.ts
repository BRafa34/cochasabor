import { Component, computed, effect, input, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Icon } from '../../../../shared/ui/icon/icon';
@Component({
  selector: 'app-gallery',
  imports: [NgOptimizedImage, Icon],
  template: ` <div class="gallery">
    <div class="main-photo">
      @if (current(); as photo) {
        @if (!failed()) {
          <img
            [ngSrc]="photo"
            fill
            sizes="(max-width: 700px) 100vw, 66vw"
            [alt]="alt()"
            priority
            (error)="failed.set(true)"
          />
        } @else {
          <div class="fallback">
            <app-icon name="camera" />
            <p>Esta fotografía no está disponible.</p>
          </div>
        }
      } @else {
        <div class="fallback">
          <app-icon name="camera" />
          <p>Pronto habrá fotografías de este lugar.</p>
        </div>
      }
      <span class="caption">Fotografía ilustrativa</span>
    </div>
    @if (images().length > 1) {
      <div class="thumbnails" aria-label="Elegir fotografía">
        @for (photo of images(); track $index) {
          <button
            [class.selected]="selected() === $index"
            [attr.aria-pressed]="selected() === $index"
            [attr.aria-label]="'Ver fotografía ' + ($index + 1)"
            (click)="select($index)"
          >
            <img [ngSrc]="photo" fill disableOptimizedSrcset alt="" />
          </button>
        }
      </div>
    }
    <p class="sr-only" aria-live="polite">
      Fotografía {{ selected() + 1 }} de {{ images().length }}
    </p>
  </div>`,
  styles:
    '.main-photo{position:relative;aspect-ratio:1.65;background:#eeede3;border-radius:13px;overflow:hidden}.main-photo img{width:100%;height:100%;object-fit:cover}.caption{position:absolute;bottom:15px;right:15px;background:#202923d9;color:#fff;padding:6px 10px;border-radius:4px;font-size:.65rem}.thumbnails{display:flex;gap:12px;margin-top:15px;flex-wrap:wrap}.thumbnails button{position:relative;width:110px;aspect-ratio:1.45;border:2px solid transparent;padding:3px;background:transparent;border-radius:8px;cursor:pointer}.thumbnails img{height:100%;width:100%;object-fit:cover;border-radius:4px}.thumbnails .selected{border-color:var(--terracotta)}.fallback{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--muted)}.fallback app-icon{width:40px;height:40px}@media(max-width:600px){.main-photo{aspect-ratio:1.2}.thumbnails button{width:80px}.thumbnails{gap:8px}}',
})
export class Gallery {
  readonly images = input<string[]>([]);
  readonly alt = input('Fotografía ilustrativa del lugar');
  readonly selected = signal(0);
  readonly failed = signal(false);
  readonly current = computed(() => this.images()[this.selected()] ?? this.images()[0]);
  constructor() {
    effect(() => {
      this.images();
      this.selected.set(0);
      this.failed.set(false);
    });
  }
  select(index: number): void {
    this.selected.set(index);
    this.failed.set(false);
  }
}
