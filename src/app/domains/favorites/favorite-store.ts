import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api';
import { DataModeService } from '../../core/data-mode/data-mode';
import { Session } from '../../core/session/session';
@Injectable({ providedIn: 'root' })
export class FavoriteStore {
  readonly session = inject(Session);
  readonly mode = inject(DataModeService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly saved = signal<Record<string, string[]>>(this.restore());
  private readonly apiSaved = signal<string[]>([]);
  readonly ids = computed(() =>
    this.mode.isApi() ? this.apiSaved() : (this.saved()[this.session.profile()?.id ?? ''] ?? []),
  );
  readonly error = signal('');
  private restore(): Record<string, string[]> {
    try {
      const value: unknown = JSON.parse(localStorage.getItem('cochasabor.favorites') ?? '{}');
      if (
        typeof value === 'object' &&
        value !== null &&
        Object.values(value).every(
          (v) => Array.isArray(v) && v.every((id) => typeof id === 'string'),
        )
      )
        return value as Record<string, string[]>;
    } catch {
      /* Use empty favorites if storage is unavailable. */
    }
    return {};
  }
  has(id: string): boolean {
    return this.ids().includes(id);
  }
  async refresh(): Promise<void> {
    if (!this.mode.isApi() || !this.session.profile()) {
      this.apiSaved.set([]);
      return;
    }
    try {
      const response = await firstValueFrom(
        this.http.get<{ items: Array<{ id: string | number }> }>(`${API_BASE_URL}/me/favorites`, {
          withCredentials: true,
        }),
      );
      this.apiSaved.set(response.items.map((item) => String(item.id)));
      this.error.set('');
    } catch {
      this.error.set('No pudimos cargar tus favoritos desde el servidor. Inténtalo de nuevo.');
    }
  }
  toggle(id: string): void {
    const user = this.session.profile();
    if (!user) {
      void this.router.navigate(['/acceso'], {
        queryParams: { retorno: this.router.url, guardar: id },
      });
      return;
    }
    if (this.mode.isApi()) {
      void this.toggleApi(id);
      return;
    }
    const ids = this.has(id) ? this.ids().filter((item) => item !== id) : [...this.ids(), id];
    const next = { ...this.saved(), [user.id]: ids };
    try {
      localStorage.setItem('cochasabor.favorites', JSON.stringify(next));
      this.saved.set(next);
      this.error.set('');
    } catch {
      this.error.set('No pudimos guardar tus favoritos en este navegador. Inténtalo de nuevo.');
    }
  }

  private async toggleApi(id: string): Promise<void> {
    try {
      if (this.has(id)) {
        await firstValueFrom(
          this.http.delete(`${API_BASE_URL}/me/favorites/${encodeURIComponent(id)}`, {
            withCredentials: true,
          }),
        );
        this.apiSaved.update((ids) => ids.filter((savedId) => savedId !== id));
      } else {
        await firstValueFrom(
          this.http.put(
            `${API_BASE_URL}/me/favorites/${encodeURIComponent(id)}`,
            {},
            { withCredentials: true },
          ),
        );
        this.apiSaved.update((ids) => (ids.includes(id) ? ids : [...ids, id]));
      }
      this.error.set('');
    } catch {
      this.error.set('No pudimos actualizar tus favoritos del servidor. Inténtalo de nuevo.');
    }
  }
}
