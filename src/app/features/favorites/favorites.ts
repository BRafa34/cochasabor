import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DirectoryState } from '../../domains/places/directory-state';
import { FavoriteStore } from '../../domains/favorites/favorite-store';
import { PlaceCard } from '../../domains/places/ui/place-card/place-card';
import { LoadState } from '../../shared/ui/load-state/load-state';
import { Icon } from '../../shared/ui/icon/icon';
@Component({
  selector: 'app-favorites',
  imports: [RouterLink, PlaceCard, LoadState, Icon],
  template: ` <div class="container">
    <div class="page-heading">
      <p class="eyebrow"><app-icon name="heart" />TU COLECCIÓN PERSONAL</p>
      <h1>Lugares para volver.</h1>
      <p>
        Hola, {{ favorites.session.profile()?.name }}. Aquí están los lugares que guardaste para tu
        próximo plan.
      </p>
      <a class="link-arrow" routerLink="/lugares">Seguir explorando<app-icon name="arrow" /></a>
    </div>
    <app-load-state
      [loading]="directory.repository.loading()"
      [error]="directory.repository.error()"
      [empty]="!places().length"
      heading="Tu próxima historia todavía está por escribirse"
      message="Toca el corazón de un lugar para encontrarlo aquí."
      (retry)="directory.repository.load()"
    />
    @if (favorites.error()) {
      <p class="error-message" role="alert">{{ favorites.error() }}</p>
    }
    <div class="place-grid">
      @for (place of places(); track place.id) {
        <app-place-card
          [place]="place"
          [priority]="$index === 0"
          [category]="directory.category(place.categoryIds[0])"
          [saved]="true"
          returnUrl="/favoritos"
          (favoriteChange)="favorites.toggle($event)"
        />
      }
    </div>
    <p class="notice">
      {{
        favorites.mode.isApi()
          ? 'Tus favoritos se guardan en tu cuenta en el servidor.'
          : 'Tus favoritos se guardan en este navegador y se vinculan a tu perfil de demostración.'
      }}
    </p>
  </div>`,
  styles: ':host{display:block;padding-bottom:60px}.notice{margin-top:30px}',
})
export class Favorites {
  readonly directory = inject(DirectoryState);
  readonly favorites = inject(FavoriteStore);
  readonly places = computed(() => this.directory.places().filter((p) => this.favorites.has(p.id)));
}
