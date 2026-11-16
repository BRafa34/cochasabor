import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Session } from '../../core/session/session';
import { Icon } from '../../shared/ui/icon/icon';
import { DataModeService } from '../../core/data-mode/data-mode';
import { PlacesRepository } from '../../domains/places/places';
import { FavoriteStore } from '../../domains/favorites/favorite-store';
@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, Icon],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  readonly session = inject(Session);
  readonly mode = inject(DataModeService);
  readonly open = signal(false);
  private readonly router = inject(Router);
  private readonly repository = inject(PlacesRepository);
  private readonly favorites = inject(FavoriteStore);

  constructor() {
    void this.session.refresh().then(() => this.favorites.refresh());
  }

  toggleMode(): void {
    this.mode.toggle();
    void this.repository.load();
    void this.session.refresh().then(() => this.favorites.refresh());
    this.open.set(false);
  }

  async logout(): Promise<void> {
    if (this.mode.isApi()) {
      try {
        await this.session.logoutApi();
        await this.favorites.refresh();
      } catch (error) {
        this.session.error.set(
          error instanceof Error ? error.message : 'No pudimos cerrar la sesión.',
        );
        return;
      }
    } else {
      this.session.leave();
    }
    this.open.set(false);
    void this.router.navigate(['/']);
  }
}
