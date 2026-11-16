import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api';
import { DataModeService } from '../../core/data-mode/data-mode';
import { Review } from '../reviews/reviews';
import { Category, Directory, Place, PlacesRepository } from './places';
import { parseDirectory, safeMediaUrl } from './json-places-repository';

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  if (typeof value === 'string' && value.length > 0) return value.split('\n').filter(Boolean);
  return [];
}

@Injectable()
export class SelectablePlacesRepository extends PlacesRepository {
  private readonly http = inject(HttpClient);
  private readonly mode = inject(DataModeService);
  readonly data = signal<Directory | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  private requestId = 0;

  async load(): Promise<void> {
    const requestId = ++this.requestId;
    const mode = this.mode.mode();
    this.loading.set(true);
    this.error.set('');
    this.data.set(null);
    try {
      const directory = mode === 'demo' ? await this.loadDemo() : await this.loadApi();
      if (requestId === this.requestId && this.mode.mode() === mode) this.data.set(directory);
    } catch {
      if (requestId === this.requestId) {
        this.error.set(
          mode === 'api'
            ? 'No pudimos cargar la API. Inicia el backend y revisa la conexión con MariaDB.'
            : 'No pudimos cargar los datos de demostración. Comprueba tu conexión y vuelve a intentarlo.',
        );
      }
    } finally {
      if (requestId === this.requestId) this.loading.set(false);
    }
  }

  private async loadDemo(): Promise<Directory> {
    const response = await firstValueFrom(this.http.get<unknown>('/data/directory.json'));
    return parseDirectory(response);
  }

  private async loadApi(): Promise<Directory> {
    const options = { withCredentials: true };
    const [categoriesResponse, places, reviews, localResponse] = await Promise.all([
      firstValueFrom(this.http.get<unknown>(`${API_BASE_URL}/categories`, options)),
      this.fetchAll('/places'),
      this.fetchAll('/reviews'),
      firstValueFrom(this.http.get<unknown>('/data/directory.json')),
    ]);
    const local = parseDirectory(localResponse);
    const localCategories = new Map(local.categories.map((category) => [category.id, category]));

    if (!record(categoriesResponse) || !Array.isArray(categoriesResponse['items'])) {
      throw new Error('Respuesta de categorías inválida.');
    }
    const categories: Category[] = categoriesResponse['items'].map((value: unknown) => {
      if (
        !record(value) ||
        typeof value['slug'] !== 'string' ||
        typeof value['name'] !== 'string'
      ) {
        throw new Error('Categoría API inválida.');
      }
      const slug = value['slug'];
      const presentation = localCategories.get(slug);
      return {
        id: slug,
        name: value['name'],
        singular: presentation?.singular ?? value['name'],
        icon: presentation?.icon ?? 'compass',
        description: presentation?.description ?? '',
      };
    });

    const localPlaces = new Map(local.places.map((place) => [place.slug, place]));
    const mappedPlaces: Place[] = places.map((value) => {
      if (
        !record(value) ||
        (typeof value['id'] !== 'string' && typeof value['id'] !== 'number') ||
        typeof value['slug'] !== 'string' ||
        typeof value['name'] !== 'string' ||
        typeof value['description'] !== 'string' ||
        typeof value['zone'] !== 'string' ||
        !Array.isArray(value['categoryIds'])
      ) {
        throw new Error('Lugar API inválido.');
      }
      const presentation = localPlaces.get(value['slug']);
      const image = safeMediaUrl(value['image']) ? value['image'] : presentation?.image;
      if (!image) throw new Error('Falta una imagen de portada para el lugar.');
      const apiGallery = stringList(value['gallery']).filter(safeMediaUrl);
      const gallery = apiGallery.length ? apiGallery : (presentation?.gallery ?? []);
      const videoSrc = value['videoSrc'];
      const video = safeMediaUrl(videoSrc)
        ? {
            src: videoSrc,
            poster: image,
            description:
              typeof value['videoDescription'] === 'string'
                ? value['videoDescription']
                : `Video de ${value['name']}`,
          }
        : presentation?.video;
      const categoryIds = value['categoryIds'].filter(
        (id): id is string =>
          typeof id === 'string' && categories.some((category) => category.id === id),
      );

      return {
        id: String(value['id']),
        slug: value['slug'],
        name: value['name'],
        categoryIds,
        zone: value['zone'],
        address: typeof value['address'] === 'string' ? value['address'] : '',
        description: value['description'],
        shortDescription:
          typeof value['shortDescription'] === 'string'
            ? value['shortDescription']
            : (presentation?.shortDescription ?? value['description'].slice(0, 150)),
        image,
        imageAlt:
          typeof value['imageAlt'] === 'string'
            ? value['imageAlt']
            : (presentation?.imageAlt ?? `Imagen ilustrativa de ${value['name']}`),
        gallery,
        price:
          typeof value['price'] === 'string'
            ? value['price']
            : (presentation?.price ?? 'Precio no informado'),
        hours:
          typeof value['hours'] === 'string' && value['hours'].length > 0
            ? value['hours']
            : (presentation?.hours ?? ''),
        featured:
          typeof value['featured'] === 'boolean'
            ? value['featured']
            : (presentation?.featured ?? false),
        ...(video ? { video } : {}),
      };
    });

    const mappedReviews = reviews.map((value): Review => {
      if (
        !record(value) ||
        (typeof value['id'] !== 'string' && typeof value['id'] !== 'number') ||
        (typeof value['placeId'] !== 'string' && typeof value['placeId'] !== 'number') ||
        (typeof value['userId'] !== 'string' && typeof value['userId'] !== 'number') ||
        typeof value['displayName'] !== 'string' ||
        typeof value['comment'] !== 'string' ||
        typeof value['rating'] !== 'number' ||
        typeof value['createdAt'] !== 'string'
      ) {
        throw new Error('Reseña API inválida.');
      }
      return {
        id: String(value['id']),
        placeId: String(value['placeId']),
        userId: String(value['userId']),
        displayName: value['displayName'],
        rating: value['rating'],
        comment: value['comment'],
        createdAt: value['createdAt'],
      };
    });
    return { categories, places: mappedPlaces, reviews: mappedReviews };
  }

  private async fetchAll(path: string): Promise<unknown[]> {
    const pageSize = 50;
    const items: unknown[] = [];
    let page = 1;
    let total = Number.POSITIVE_INFINITY;
    while (items.length < total) {
      const response = await firstValueFrom(
        this.http.get<unknown>(`${API_BASE_URL}${path}`, {
          params: { page, pageSize },
          withCredentials: true,
        }),
      );
      if (
        !record(response) ||
        !Array.isArray(response['items']) ||
        typeof response['total'] !== 'number'
      ) {
        throw new Error('Respuesta paginada API inválida.');
      }
      items.push(...response['items']);
      total = response['total'];
      if (response['items'].length === 0) break;
      page += 1;
    }
    return items;
  }
}
