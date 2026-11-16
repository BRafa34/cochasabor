import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgOptimizedImage } from '@angular/common';
import { Icon } from '../../../../shared/ui/icon/icon';
@Component({
  selector: 'app-home-hero',
  imports: [RouterLink, ReactiveFormsModule, NgOptimizedImage, Icon],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class HomeHero {
  private readonly router = inject(Router);
  readonly search = new FormControl('', { nonNullable: true });
  searchPlaces(): void {
    void this.router.navigate(['/lugares'], {
      queryParams: { q: this.search.value.trim() || null },
    });
  }
}
