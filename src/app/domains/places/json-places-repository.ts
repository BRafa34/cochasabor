import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Category, Directory, Place, PlacesRepository } from './places';
import { Review, validReview } from '../reviews/reviews';
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
function strings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}
function fields(value: Record<string, unknown>, names: string[]): boolean {
  return names.every((k) => typeof value[k] === 'string');
}
export function safeMediaUrl(value: unknown): value is string {
  return (
    typeof value === 'string' && /^\/media\/[a-zA-Z0-9._/-]+$/.test(value) && !value.includes('..')
  );
}
export function parseDirectory(value: unknown): Directory {
  if (
    !record(value) ||
    !Array.isArray(value['categories']) ||
    !Array.isArray(value['places']) ||
    !Array.isArray(value['reviews'])
  )
    throw new Error('Formato de directorio inválido.');
  const categories: Category[] = value['categories'].map((v: unknown) => {
    if (!record(v) || !fields(v, ['id', 'name', 'singular', 'icon', 'description']))
      throw new Error('Categoría inválida.');
    return {
      id: String(v['id']),
      name: String(v['name']),
      singular: String(v['singular']),
      icon: String(v['icon']),
      description: String(v['description']),
    };
  });
  const places: Place[] = value['places'].map((v: unknown) => {
    if (
      !record(v) ||
      !fields(v, [
        'id',
        'slug',
        'name',
        'zone',
        'address',
        'description',
        'shortDescription',
        'image',
        'imageAlt',
        'price',
        'hours',
      ]) ||
      !strings(v['categoryIds']) ||
      !strings(v['gallery']) ||
      typeof v['featured'] !== 'boolean' ||
      !safeMediaUrl(v['image']) ||
      !v['gallery'].every(safeMediaUrl) ||
      !v['categoryIds'].every((id) => categories.some((c) => c.id === id))
    )
      throw new Error('Lugar inválido.');
    let video: Place['video'];
    if (v['video'] !== undefined) {
      const media = v['video'];
      if (
        !record(media) ||
        !safeMediaUrl(media['src']) ||
        !safeMediaUrl(media['poster']) ||
        typeof media['description'] !== 'string'
      )
        throw new Error('Video inválido.');
      video = { src: media['src'], poster: media['poster'], description: media['description'] };
    }
    return {
      id: String(v['id']),
      slug: String(v['slug']),
      name: String(v['name']),
      categoryIds: v['categoryIds'],
      zone: String(v['zone']),
      address: String(v['address']),
      description: String(v['description']),
      shortDescription: String(v['shortDescription']),
      image: v['image'],
      imageAlt: String(v['imageAlt']),
      gallery: v['gallery'],
      price: String(v['price']),
      hours: String(v['hours']),
      featured: v['featured'],
      video,
    };
  });
  const reviews: Review[] = value['reviews'].map((v: unknown) => {
    if (
      !record(v) ||
      !fields(v, ['id', 'placeId', 'userId', 'displayName', 'comment', 'createdAt']) ||
      typeof v['rating'] !== 'number' ||
      !validReview(v['rating'], String(v['comment'])) ||
      !places.some((p) => p.id === v['placeId']) ||
      (v['photo'] !== undefined && !safeMediaUrl(v['photo']))
    )
      throw new Error('Reseña inválida.');
    return {
      id: String(v['id']),
      placeId: String(v['placeId']),
      userId: String(v['userId']),
      displayName: String(v['displayName']),
      rating: v['rating'],
      comment: String(v['comment']),
      createdAt: String(v['createdAt']),
      ...(typeof v['photo'] === 'string' ? { photo: v['photo'] } : {}),
    };
  });
  if (
    new Set(places.map((p) => p.id)).size !== places.length ||
    new Set(places.map((p) => p.slug)).size !== places.length ||
    new Set(categories.map((c) => c.id)).size !== categories.length ||
    new Set(reviews.map((r) => `${r.placeId}:${r.userId}`)).size !== reviews.length
  )
    throw new Error('Datos duplicados en el directorio.');
  return { categories, places, reviews };
}
@Injectable()
export class JsonPlacesRepository extends PlacesRepository {
  private readonly http = inject(HttpClient);
  readonly data = signal<Directory | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  private pending: Promise<void> | null = null;
  load(): Promise<void> {
    if (this.pending) return this.pending;
    this.loading.set(true);
    this.error.set('');
    this.pending = this.fetch().finally(() => {
      this.loading.set(false);
      this.pending = null;
    });
    return this.pending;
  }
  private async fetch(): Promise<void> {
    try {
      this.data.set(
        parseDirectory(await firstValueFrom(this.http.get<unknown>('/data/directory.json'))),
      );
    } catch {
      this.error.set('No pudimos cargar los lugares. Comprueba tu conexión y vuelve a intentarlo.');
    }
  }
}
