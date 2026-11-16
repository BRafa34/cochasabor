import 'fake-indexeddb/auto';
import { signal } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import fixture from '../../public/data/directory.json';
import { routes } from './app.routes';
import { PlacesRepository } from './domains/places/places';
import { parseDirectory } from './domains/places/json-places-repository';
import { Catalog } from './features/catalog/catalog';
import { PlaceDetail } from './features/place-detail/place-detail';
import { Authentication } from './features/authentication/authentication';
import { ReviewEditor } from './features/review-editor/review-editor';
import { NotFound } from './features/not-found/not-found';
import { Session } from './core/session/session';
registerLocaleData(localeEs);
describe('Directory routes', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        {
          provide: PlacesRepository,
          useValue: {
            data: signal(parseDirectory(fixture)),
            loading: signal(false),
            error: signal(''),
            load: () => Promise.resolve(),
          },
        },
      ],
    });
  });
  it('opens the filtered catalog, navigates to a detail and restores the same filters', async () => {
    const harness = await RouterTestingHarness.create();
    const catalog = await harness.navigateByUrl('/lugares?q=cafe&categoria=restaurantes', Catalog);
    expect(catalog.results().total).toBe(1);
    harness.routeNativeElement?.querySelector<HTMLAnchorElement>('h3 a')?.click();
    await harness.fixture.whenStable();
    const router = TestBed.inject(Router);
    expect(router.url).toContain('/lugares/cafe-del-patio?volver=');
    const detail = harness.routeDebugElement?.componentInstance as PlaceDetail;
    expect(detail.place()?.slug).toBe('cafe-del-patio');
    harness.routeNativeElement?.querySelector<HTMLAnchorElement>('a.back')?.click();
    await harness.fixture.whenStable();
    const restored = harness.routeDebugElement?.componentInstance as Catalog;
    expect(restored.filters().q).toBe('cafe');
    expect(restored.filters().categoria).toBe('restaurantes');
  });
  it('requires a demo profile for a review and preserves the original destination', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/lugares/cafe-del-patio/resena', Authentication);
    expect(TestBed.inject(Router).url).toContain('/acceso?retorno=');
    TestBed.inject(Session).enter('Perfil Pruebas');
    const editor = await harness.navigateByUrl('/lugares/cafe-del-patio/resena', ReviewEditor);
    expect(editor.place()?.slug).toBe('cafe-del-patio');
  });
  it('provides a useful 404 for unknown URLs', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/ruta-inexistente', NotFound);
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'todavía no existe',
    );
    expect(
      harness.routeNativeElement
        ?.querySelector<HTMLAnchorElement>('a.button')
        ?.getAttribute('href'),
    ).toBe('/lugares');
  });
});
