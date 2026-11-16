import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DirectoryState } from '../../domains/places/directory-state';
import { FavoriteStore } from '../../domains/favorites/favorite-store';
import { parseFilters, filterPlaces } from '../../domains/places/catalog-filters';
import { CatalogFilters } from '../../domains/places/places';
import { PlaceCard } from '../../domains/places/ui/place-card/place-card';
import { Icon } from '../../shared/ui/icon/icon';
import { LoadState } from '../../shared/ui/load-state/load-state';
@Component({
  selector: 'app-catalog',
  imports: [ReactiveFormsModule, PlaceCard, Icon, LoadState],
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss',
})
export class Catalog {
  readonly directory = inject(DirectoryState);
  readonly favorites = inject(FavoriteStore);
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.queryParams, {
    initialValue: this.route.snapshot.queryParams,
  });
  readonly filters = computed(() =>
    parseFilters(
      this.params(),
      this.directory.categories().map((c) => c.id),
    ),
  );
  readonly results = computed(() => filterPlaces(this.directory.places(), this.filters()));
  readonly pages = computed(() =>
    Array.from(
      { length: Math.ceil(this.results().total / this.results().pageSize) },
      (_, i) => i + 1,
    ),
  );
  readonly search = new FormControl('', { nonNullable: true });
  change(change: Partial<CatalogFilters>): void {
    const next = { ...this.filters(), pagina: 1, ...change };
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: next.q || null,
        categoria: next.categoria || null,
        orden: next.orden === 'recomendados' ? null : next.orden,
        pagina: next.pagina === 1 ? null : next.pagina,
      },
    });
  }
  searchPlaces(value: string): void {
    this.change({ q: value.trim() });
  }
  changeOrder(value: string): void {
    this.change({ orden: value === 'nombre' || value === 'valoracion' ? value : 'recomendados' });
  }
  reset(): void {
    this.search.reset();
    void this.router.navigate(['/lugares']);
  }
}
