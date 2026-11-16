import { Routes } from '@angular/router';
import { demoSessionGuard } from './core/session/session';
export const routes: Routes = [
  {
    path: '',
    title: 'CochaSabor · Saborea. Explora. Descubre.',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'lugares',
    title: 'Explorar lugares · CochaSabor',
    loadComponent: () => import('./features/catalog/catalog').then((m) => m.Catalog),
  },
  {
    path: 'lugares/:slug/resena',
    title: 'Escribir reseña · CochaSabor',
    canActivate: [demoSessionGuard],
    loadComponent: () =>
      import('./features/review-editor/review-editor').then((m) => m.ReviewEditor),
  },
  {
    path: 'lugares/:slug',
    loadComponent: () => import('./features/place-detail/place-detail').then((m) => m.PlaceDetail),
  },
  {
    path: 'acceso',
    title: 'Ingresar · CochaSabor',
    loadComponent: () =>
      import('./features/authentication/authentication').then((m) => m.Authentication),
  },
  {
    path: 'registro',
    title: 'Crear cuenta · CochaSabor',
    loadComponent: () =>
      import('./features/authentication/authentication').then((m) => m.Authentication),
  },
  {
    path: 'favoritos',
    title: 'Mis favoritos · CochaSabor',
    canActivate: [demoSessionGuard],
    loadComponent: () => import('./features/favorites/favorites').then((m) => m.Favorites),
  },
  {
    path: '**',
    title: 'Página no encontrada · CochaSabor',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
