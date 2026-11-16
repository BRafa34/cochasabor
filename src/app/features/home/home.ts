import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { DirectoryState } from '../../domains/places/directory-state';
import { FavoriteStore } from '../../domains/favorites/favorite-store';
import { PlaceCard } from '../../domains/places/ui/place-card/place-card';
import { Icon } from '../../shared/ui/icon/icon';
import { LoadState } from '../../shared/ui/load-state/load-state';
import { HomeHero } from './ui/hero/hero';
@Component({
  selector: 'app-home',
  imports: [HomeHero, RouterLink, NgOptimizedImage, PlaceCard, Icon, LoadState],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  readonly directory = inject(DirectoryState);
  readonly favorites = inject(FavoriteStore);
  readonly featured = computed(() =>
    this.directory
      .places()
      .filter((p) => p.featured)
      .slice(0, 3),
  );
}
