import { Component, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { PlaceSummary } from '../../places';
import { Rating } from '../../../../shared/ui/rating/rating';
import { Icon } from '../../../../shared/ui/icon/icon';
@Component({
  selector: 'app-place-card',
  imports: [RouterLink, NgOptimizedImage, Rating, Icon],
  templateUrl: './place-card.html',
  styleUrl: './place-card.scss',
})
export class PlaceCard {
  readonly place = input.required<PlaceSummary>();
  readonly category = input('');
  readonly saved = input(false);
  readonly priority = input(false);
  readonly returnUrl = input('/lugares');
  readonly favoriteChange = output<string>();
  readonly imageFailed = signal(false);
}
