import fixture from '../../../../public/data/directory.json';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { JsonPlacesRepository, parseDirectory, safeMediaUrl } from './json-places-repository';
describe('JSON contract', () => {
  it('loads all categories, eight unique places and explicitly simulated reviews', () => {
    const data = parseDirectory(fixture);
    expect(data.categories).toHaveLength(4);
    expect(data.places).toHaveLength(8);
    expect(data.reviews.every((r) => r.displayName.startsWith('Visitante demo'))).toBe(true);
  });
  it('rejects malformed responses, unsafe media and broken category relationships', () => {
    expect(() => parseDirectory(null)).toThrow();
    const invalid = structuredClone(fixture);
    invalid.places[0].categoryIds = ['no-existe'];
    expect(() => parseDirectory(invalid)).toThrow('Lugar inválido');
    expect(safeMediaUrl('javascript:alert(1)')).toBe(false);
    expect(safeMediaUrl('/media/../secret')).toBe(false);
    expect(safeMediaUrl('/media/food.webp')).toBe(true);
  });
  it('rejects duplicate slugs and duplicate reviews per visitor and place', () => {
    const duplicate = structuredClone(fixture);
    duplicate.places[1].slug = duplicate.places[0].slug;
    expect(() => parseDirectory(duplicate)).toThrow('Datos duplicados');
    const reviews = structuredClone(fixture);
    reviews.reviews.push(reviews.reviews[0]);
    expect(() => parseDirectory(reviews)).toThrow('Datos duplicados');
  });
});

describe('JSON repository loading and recovery', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), JsonPlacesRepository],
    }),
  );
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('shares concurrent loads and exposes loading until the request completes', async () => {
    const repository = TestBed.inject(JsonPlacesRepository);
    const first = repository.load();
    const second = repository.load();
    expect(first).toBe(second);
    expect(repository.loading()).toBe(true);
    TestBed.inject(HttpTestingController).expectOne('/data/directory.json').flush(fixture);
    await first;
    expect(repository.loading()).toBe(false);
    expect(repository.data()?.places).toHaveLength(8);
  });
  it('shows a recoverable error and only loads data after a successful retry', async () => {
    const repository = TestBed.inject(JsonPlacesRepository);
    const failed = repository.load();
    TestBed.inject(HttpTestingController)
      .expectOne('/data/directory.json')
      .flush('failure', { status: 500, statusText: 'Failure' });
    await failed;
    expect(repository.error()).toContain('vuelve a intentarlo');
    expect(repository.data()).toBeNull();
    const retry = repository.load();
    TestBed.inject(HttpTestingController).expectOne('/data/directory.json').flush(fixture);
    await retry;
    expect(repository.error()).toBe('');
    expect(repository.data()?.categories).toHaveLength(4);
  });
});
