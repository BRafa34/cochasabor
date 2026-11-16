import { Injectable, signal } from '@angular/core';
import { Review, validReview } from './reviews';
@Injectable({ providedIn: 'root' })
export class DemoReviewStore {
  readonly reviews = signal<Review[]>([]);
  readonly error = signal('');
  private readonly ready = this.restore();
  whenReady(): Promise<void> {
    return this.ready;
  }
  private async database(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('cochasabor-demo', 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore('reviews', { keyPath: 'id' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('El almacenamiento local no está disponible.'));
    });
  }
  private async restore(): Promise<void> {
    try {
      const db = await this.database();
      const rows = await new Promise<unknown[]>((resolve, reject) => {
        const request = db.transaction('reviews').objectStore('reviews').getAll();
        request.onsuccess = () => resolve(request.result as unknown[]);
        request.onerror = () => reject(request.error);
      });
      const restored: Review[] = [];
      for (const row of rows) {
        if (typeof row !== 'object' || row === null) continue;
        const r = row as Record<string, unknown>;
        if (
          ['id', 'placeId', 'userId', 'displayName', 'comment', 'createdAt'].some(
            (key) => typeof r[key] !== 'string',
          ) ||
          typeof r['rating'] !== 'number'
        )
          continue;
        if (!validReview(r['rating'], String(r['comment']))) continue;
        if (
          r['photo'] !== undefined &&
          (typeof r['photo'] !== 'string' ||
            !/^data:image\/(webp|png|jpeg);base64,[a-zA-Z0-9+/=]+$/.test(r['photo']))
        )
          continue;
        restored.push({
          id: String(r['id']),
          placeId: String(r['placeId']),
          userId: String(r['userId']),
          displayName: String(r['displayName']),
          comment: String(r['comment']),
          createdAt: String(r['createdAt']),
          rating: r['rating'],
          ...(typeof r['photo'] === 'string' ? { photo: r['photo'] } : {}),
        });
      }
      this.reviews.set(restored);
      db.close();
    } catch {
      this.error.set('No pudimos recuperar tus reseñas de este navegador.');
    }
  }
  async save(review: Review, seed: Review[]): Promise<void> {
    await this.ready;
    if (!validReview(review.rating, review.comment))
      throw new Error('Comprueba la calificación y el comentario.');
    if (
      [...seed, ...this.reviews()].some(
        (r) => r.placeId === review.placeId && r.userId === review.userId,
      )
    )
      throw new Error('Ya escribiste una reseña para este lugar con este perfil.');
    const db = await this.database();
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('reviews', 'readwrite');
        transaction.objectStore('reviews').add(review);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () =>
          reject(new Error('No se pudo guardar la reseña. Intenta con una foto más pequeña.'));
        transaction.onabort = () =>
          reject(
            new Error('No se pudo guardar la reseña. Los datos se conservan en el formulario.'),
          );
      });
      this.reviews.update((rows) => [review, ...rows]);
      this.error.set('');
    } finally {
      db.close();
    }
  }
}
