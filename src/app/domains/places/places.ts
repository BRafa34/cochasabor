import { Signal } from '@angular/core';
import { Review } from '../reviews/reviews';
export interface Category {
  id: string;
  name: string;
  singular: string;
  icon: string;
  description: string;
}
export interface Place {
  id: string;
  slug: string;
  name: string;
  categoryIds: string[];
  zone: string;
  address: string;
  description: string;
  shortDescription: string;
  image: string;
  imageAlt: string;
  gallery: string[];
  price: string;
  hours: string;
  featured: boolean;
  video?: { src: string; poster: string; description: string };
}
export interface Directory {
  categories: Category[];
  places: Place[];
  reviews: Review[];
}
export interface PlaceSummary extends Place {
  ratingAverage: number | null;
  reviewCount: number;
}
export interface CatalogFilters {
  q: string;
  categoria: string;
  orden: 'recomendados' | 'valoracion' | 'nombre';
  pagina: number;
}
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
export abstract class PlacesRepository {
  abstract readonly data: Signal<Directory | null>;
  abstract readonly loading: Signal<boolean>;
  abstract readonly error: Signal<string>;
  abstract load(): Promise<void>;
}
