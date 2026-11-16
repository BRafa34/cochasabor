import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { DirectoryState } from '../../domains/places/directory-state';
import { internalReturn, Session } from '../../core/session/session';
import { validPhoto } from '../../domains/reviews/reviews';
import { Icon } from '../../shared/ui/icon/icon';
import { LoadState } from '../../shared/ui/load-state/load-state';
import { DataModeService } from '../../core/data-mode/data-mode';
import { ReviewsApi } from '../../domains/reviews/reviews-api';

export function commentValidator(control: AbstractControl<string>): ValidationErrors | null {
  const length = control.value.trim().length;
  return length >= 10 && length <= 1000 ? null : { commentLength: true };
}
export function ratingValidator(control: AbstractControl<number>): ValidationErrors | null {
  return Number.isInteger(control.value) && control.value >= 1 && control.value <= 5
    ? null
    : { rating: true };
}
@Component({
  selector: 'app-review-editor',
  imports: [RouterLink, ReactiveFormsModule, Icon, LoadState],
  templateUrl: './review-editor.html',
  styleUrl: './review-editor.scss',
})
export class ReviewEditor implements OnDestroy {
  readonly directory = inject(DirectoryState);
  readonly session = inject(Session);
  readonly mode = inject(DataModeService);
  private readonly apiReviews = inject(ReviewsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly place = computed(() =>
    this.directory.places().find((p) => p.slug === this.route.snapshot.paramMap.get('slug')),
  );
  readonly duplicate = computed(() =>
    this.directory
      .reviews()
      .some((r) => r.placeId === this.place()?.id && r.userId === this.session.profile()?.id),
  );
  readonly submitted = signal(false);
  readonly saving = signal(false);
  readonly processing = signal(false);
  readonly error = signal('');
  readonly photoError = signal('');
  readonly preview = signal('');
  private photoData = '';
  private photoVersion = 0;
  readonly stars = [1, 2, 3, 4, 5];
  readonly routeBack = internalReturn(
    this.route.snapshot.queryParamMap.get('volver') ?? '/lugares',
  );
  readonly form = new FormGroup({
    rating: new FormControl(0, { nonNullable: true, validators: ratingValidator }),
    comment: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, commentValidator],
    }),
  });
  readonly chosen = toSignal(this.form.controls.rating.valueChanges, { initialValue: 0 });
  readonly comment = toSignal(this.form.controls.comment.valueChanges, { initialValue: '' });
  async pickPhoto(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.clearPhoto();
    if (!file) return;
    const error = validPhoto(file);
    if (error) {
      this.photoError.set(error);
      input.value = '';
      return;
    }
    const version = this.photoVersion;
    this.processing.set(true);
    try {
      const bitmap = await createImageBitmap(file);
      if (bitmap.width > 10000 || bitmap.height > 10000) {
        bitmap.close();
        throw new Error('Imagen demasiado grande');
      }
      const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
      const canvas = new OffscreenCanvas(
        Math.max(1, Math.round(bitmap.width * scale)),
        Math.max(1, Math.round(bitmap.height * scale)),
      );
      const context = canvas.getContext('2d');
      if (!context) {
        bitmap.close();
        throw new Error('No se pudo procesar');
      }
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const blob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.8 });
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
      if (version !== this.photoVersion) return;
      this.photoData = data;
      this.preview.set(URL.createObjectURL(blob));
    } catch {
      if (version === this.photoVersion) {
        this.photoError.set(
          'No pudimos leer la fotografía. Elige una imagen JPG, PNG o WebP válida.',
        );
        input.value = '';
      }
    } finally {
      if (version === this.photoVersion) this.processing.set(false);
    }
  }
  clearPhoto(): void {
    this.photoVersion++;
    if (this.preview()) URL.revokeObjectURL(this.preview());
    this.preview.set('');
    this.photoData = '';
    this.photoError.set('');
    this.processing.set(false);
  }
  ngOnDestroy(): void {
    this.clearPhoto();
  }
  async submit(): Promise<void> {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    this.error.set('');
    if (this.form.invalid || this.photoError() || this.processing() || this.saving()) return;
    const place = this.place();
    const user = this.session.profile();
    if (!place || !user) return;
    this.saving.set(true);
    try {
      const review = {
        id: `${user.id}:${place.id}`,
        placeId: place.id,
        userId: user.id,
        displayName: user.name,
        rating: this.form.controls.rating.value,
        comment: this.form.controls.comment.value.trim(),
        createdAt: new Date().toISOString(),
        ...(!this.mode.isApi() && this.photoData ? { photo: this.photoData } : {}),
      };
      if (this.mode.isApi()) {
        await this.apiReviews.create(
          place.id,
          this.form.controls.rating.value,
          this.form.controls.comment.value.trim(),
        );
        await this.directory.repository.load();
      } else {
        await this.directory.localReviews.save(
          review,
          this.directory.repository.data()?.reviews ?? [],
        );
      }
      await this.router.navigate(['/lugares', place.slug], {
        queryParams: { publicado: '1', volver: this.route.snapshot.queryParamMap.get('volver') },
        fragment: 'reviews-title',
      });
    } catch (error: unknown) {
      this.error.set(
        error instanceof Error
          ? error.message
          : 'No pudimos guardar tu reseña. Vuelve a intentarlo.',
      );
    } finally {
      this.saving.set(false);
    }
  }
}
