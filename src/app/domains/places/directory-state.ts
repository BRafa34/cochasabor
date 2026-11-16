import { computed, inject, Injectable } from '@angular/core';
import { PlacesRepository } from './places';
import { DemoReviewStore } from '../reviews/demo-review-store';
import { ratingSummary } from '../reviews/reviews';
import { DataModeService } from '../../core/data-mode/data-mode';
@Injectable({ providedIn: 'root' })
export class DirectoryState {
  readonly repository = inject(PlacesRepository);
  readonly localReviews = inject(DemoReviewStore);
  readonly mode = inject(DataModeService);
  readonly categories = computed(() => this.repository.data()?.categories ?? []);
  readonly reviews = computed(() =>
    this.mode.isApi()
      ? (this.repository.data()?.reviews ?? [])
      : [...this.localReviews.reviews(), ...(this.repository.data()?.reviews ?? [])],
  );
  readonly places = computed(() =>
    (this.repository.data()?.places ?? []).map((p) => ({
      ...p,
      ...ratingSummary(this.reviews().filter((r) => r.placeId === p.id)),
    })),
  );
  constructor() {
    void this.repository.load();
  }
  category(id: string): string {
    return this.categories().find((c) => c.id === id)?.singular ?? id;
  }
}
