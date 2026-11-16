import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { internalReturn, Session } from '../../core/session/session';
import { FavoriteStore } from '../../domains/favorites/favorite-store';
import { DirectoryState } from '../../domains/places/directory-state';
import { Icon } from '../../shared/ui/icon/icon';
import { DataModeService } from '../../core/data-mode/data-mode';
@Component({
  selector: 'app-authentication',
  imports: [ReactiveFormsModule, RouterLink, Icon],
  templateUrl: './authentication.html',
  styleUrl: './authentication.scss',
})
export class Authentication {
  private readonly session = inject(Session);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly favorites = inject(FavoriteStore);
  private readonly directory = inject(DirectoryState);
  readonly mode = inject(DataModeService);
  readonly error = signal('');
  readonly submitted = signal(false);
  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(40)],
    }),
  });
  readonly apiForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    displayName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.minLength(2), Validators.maxLength(80)],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(12)],
    }),
  });
  readonly isRegister = this.route.snapshot.url.some((segment) => segment.path === 'registro');

  async enter(): Promise<void> {
    if (this.mode.isApi()) {
      await this.enterApi();
      return;
    }
    this.submitted.set(true);
    if (this.form.invalid) return;
    try {
      this.session.enter(this.form.controls.name.value);
      const id = this.route.snapshot.queryParamMap.get('guardar');
      if (id) await this.directory.repository.load();
      if (id && this.directory.places().some((p) => p.id === id) && !this.favorites.has(id))
        this.favorites.toggle(id);
      void this.router.navigateByUrl(
        internalReturn(this.route.snapshot.queryParamMap.get('retorno')),
      );
    } catch {
      this.error.set(
        'No pudimos abrir tu perfil. Revisa el nombre y permite almacenamiento local en este navegador.',
      );
    }
  }

  private async enterApi(): Promise<void> {
    this.submitted.set(true);
    if (
      this.apiForm.invalid ||
      (this.isRegister && !this.apiForm.controls.displayName.value.trim())
    ) {
      this.apiForm.markAllAsTouched();
      return;
    }
    const { email, displayName, password } = this.apiForm.getRawValue();
    this.error.set('');
    try {
      if (this.isRegister) await this.session.register(email, displayName, password);
      await this.session.login(email, password);
      await this.favorites.refresh();
      const id = this.route.snapshot.queryParamMap.get('guardar');
      if (id) {
        await this.directory.repository.load();
        if (this.directory.places().some((place) => place.id === id) && !this.favorites.has(id)) {
          this.favorites.toggle(id);
        }
      }
      await this.router.navigateByUrl(
        internalReturn(this.route.snapshot.queryParamMap.get('retorno')),
      );
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No pudimos completar el acceso.');
    }
  }
}
