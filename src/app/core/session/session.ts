import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../config/api';
import { DataModeService } from '../data-mode/data-mode';
import { CanActivateFn, Router } from '@angular/router';

export interface DemoProfile {
  id: string;
  name: string;
  email?: string;
}

interface AccountResponse {
  account: { id: string; email: string; displayName: string };
}

@Injectable({ providedIn: 'root' })
export class Session {
  private readonly demoProfile = signal<DemoProfile | null>(this.restore());
  readonly profile = signal<DemoProfile | null>(this.demoProfile());
  readonly error = signal('');
  private pendingRefresh: Promise<void> | null = null;

  private http?: HttpClient;
  private mode?: DataModeService;

  constructor() {
    try {
      this.http = inject(HttpClient);
      this.mode = inject(DataModeService);
    } catch {
      // Keep direct construction available to the existing local-profile examples.
    }
  }

  enter(name: string): void {
    const clean = name.trim().slice(0, 40);
    if (clean.length < 2) throw new Error('Escribe un nombre de al menos 2 caracteres.');
    const profile = { id: `demo-${clean.toLocaleLowerCase('es')}`, name: clean };
    localStorage.setItem('cochasabor.profile', JSON.stringify(profile));
    this.demoProfile.set(profile);
    if (!this.mode?.isApi()) this.profile.set(profile);
  }

  async register(email: string, displayName: string, password: string): Promise<void> {
    if (!this.mode?.isApi() || !this.http) throw new Error('El registro requiere el modo API.');
    await firstValueFrom(
      this.http.post(
        `${API_BASE_URL}/auth/register`,
        { email, displayName, password },
        { withCredentials: true },
      ),
    );
  }

  async login(email: string, password: string): Promise<void> {
    if (!this.mode?.isApi() || !this.http) throw new Error('El acceso requiere el modo API.');
    try {
      const response = await firstValueFrom(
        this.http.post<AccountResponse>(
          `${API_BASE_URL}/auth/login`,
          { email, password },
          { withCredentials: true },
        ),
      );
      this.setApiAccount(response.account);
      this.error.set('');
    } catch (error) {
      throw this.apiMessage(error, 'No pudimos iniciar sesión. Revisa el correo y la contraseña.');
    }
  }

  async refresh(): Promise<void> {
    if (!this.mode?.isApi()) {
      this.profile.set(this.demoProfile());
      this.error.set('');
      return;
    }
    if (!this.http) return;
    if (this.pendingRefresh) return this.pendingRefresh;
    this.profile.set(null);
    this.pendingRefresh = firstValueFrom(
      this.http.get<AccountResponse>(`${API_BASE_URL}/auth/me`, { withCredentials: true }),
    )
      .then((response) => {
        this.setApiAccount(response.account);
        this.error.set('');
      })
      .catch((error: unknown) => {
        this.profile.set(null);
        this.error.set(
          error instanceof HttpErrorResponse && error.status === 401
            ? ''
            : 'No pudimos comprobar la sesión de la API. Revisa el backend y la tabla user_sessions.',
        );
      })
      .finally(() => {
        this.pendingRefresh = null;
      });
    return this.pendingRefresh;
  }

  async logoutApi(): Promise<void> {
    if (!this.http) throw new Error('No hay conexión HTTP disponible.');
    try {
      await firstValueFrom(
        this.http.post<void>(`${API_BASE_URL}/auth/logout`, {}, { withCredentials: true }),
      );
      this.profile.set(null);
      this.error.set('');
    } catch (error) {
      throw this.apiMessage(error, 'No pudimos cerrar la sesión de la API.');
    }
  }

  leave(): void {
    localStorage.removeItem('cochasabor.profile');
    this.demoProfile.set(null);
    if (!this.mode?.isApi()) this.profile.set(null);
  }

  private setApiAccount(account: AccountResponse['account']): void {
    const profile = { id: String(account.id), name: account.displayName, email: account.email };
    this.profile.set(profile);
  }

  private apiMessage(error: unknown, fallback: string): Error {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return new Error(error.error.message);
    }
    return new Error(fallback);
  }

  private restore(): DemoProfile | null {
    try {
      const value: unknown = JSON.parse(localStorage.getItem('cochasabor.profile') ?? 'null');
      if (
        typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        'name' in value &&
        typeof value.id === 'string' &&
        typeof value.name === 'string'
      ) {
        return { id: value.id, name: value.name };
      }
    } catch {
      /* Unavailable storage leaves the visitor signed out. */
    }
    return null;
  }
}

export function internalReturn(value: string | null): string {
  if (value === '/') return '/';
  return value && /^\/(lugares(?:\/|\?|$)|favoritos(?:\?|$))/.test(value) && !value.includes('\\')
    ? value
    : '/favoritos';
}

export const demoSessionGuard: CanActivateFn = async (_route, state) => {
  const session = inject(Session);
  await session.refresh();
  return session.profile()
    ? true
    : inject(Router).createUrlTree(['/acceso'], { queryParams: { retorno: state.url } });
};
