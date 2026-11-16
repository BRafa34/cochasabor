import { Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { DirectoryState } from '../../domains/places/directory-state';
import { FavoriteStore } from '../../domains/favorites/favorite-store';
import { internalReturn } from '../../core/session/session';
import { Gallery } from './ui/gallery/gallery';
import { ReviewList } from './ui/review-list/review-list';
import { Rating } from '../../shared/ui/rating/rating';
import { Icon } from '../../shared/ui/icon/icon';
import { LoadState } from '../../shared/ui/load-state/load-state';
@Component({
  selector: 'app-place-detail',
  imports: [RouterLink, Gallery, ReviewList, Rating, Icon, LoadState],
  templateUrl: './place-detail.html',
  styleUrl: './place-detail.scss',
})
export class PlaceDetail {
  readonly directory = inject(DirectoryState);
  readonly favorites = inject(FavoriteStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  readonly query = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  readonly place = computed(() =>
    this.directory.places().find((p) => p.slug === this.params().get('slug')),
  );
  readonly reviews = computed(() =>
    this.directory.reviews().filter((r) => r.placeId === this.place()?.id),
  );
  readonly gallery = computed(() => {
    const p = this.place();
    return p ? [p.image, ...p.gallery] : [];
  });
  readonly back = computed(() => internalReturn(this.query().get('volver') ?? '/lugares'));
  readonly backLink = computed(() => this.router.parseUrl(this.back()));
  readonly published = computed(
    () =>
      this.query().get('publicado') === '1' &&
      this.reviews().some((review) => review.userId === this.favorites.session.profile()?.id),
  );
  constructor() {
    effect(() => {
      const place = this.place();
      this.title.setTitle(
        place
          ? `${place.name} · CochaSabor`
          : this.directory.repository.loading()
            ? 'Cargando lugar · CochaSabor'
            : 'Lugar no encontrado · CochaSabor',
      );
    });
  }
}
