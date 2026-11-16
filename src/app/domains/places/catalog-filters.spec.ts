import fixture from '../../../../public/data/directory.json';
import { parseDirectory } from './json-places-repository';
import { filterPlaces, normalizeText, parseFilters } from './catalog-filters';
import { ratingSummary } from '../reviews/reviews';

const directory = parseDirectory(fixture);
const places = directory.places.map((p) => ({
  ...p,
  ...ratingSummary(directory.reviews.filter((r) => r.placeId === p.id)),
}));
const categories = directory.categories.map((c) => c.id);
describe('Catalog filtering', () => {
  it('combines accent-insensitive search and category without duplicating multi-category places', () => {
    const page = filterPlaces(
      places,
      parseFilters({ q: 'CAFE', categoria: 'restaurantes' }, categories),
    );
    expect(page.items.map((p) => p.slug)).toEqual(['cafe-del-patio']);
    expect(page.total).toBe(1);
    expect(normalizeText('  Café  ')).toBe('cafe');
  });
  it('represents unknown filters and malformed pages safely', () => {
    expect(
      parseFilters({ pagina: 'Infinity', categoria: 'desconocida', orden: 'hack' }, categories),
    ).toEqual({ q: '', categoria: '', orden: 'recomendados', pagina: 1 });
    expect(parseFilters({ pagina: '2.5' }, categories).pagina).toBe(1);
  });
  it('clamps out-of-range pages and supplies a valid empty page', () => {
    const last = filterPlaces(places, parseFilters({ pagina: '999' }, categories));
    expect(last.page).toBe(2);
    expect(last.items).toHaveLength(2);
    expect(last.total).toBe(8);
    const empty = filterPlaces(places, parseFilters({ q: 'no-existe', pagina: '999' }, categories));
    expect(empty).toEqual({ items: [], total: 0, page: 1, pageSize: 6 });
  });
  it('orders reviewed places first and keeps an honest null rating', () => {
    const page = filterPlaces(places, parseFilters({ orden: 'valoracion' }, categories), 20);
    expect(page.items[0].ratingAverage).toBe(5);
    expect(page.items.at(-1)?.ratingAverage).toBeNull();
    expect(page.items.find((p) => p.id === 'p6')?.reviewCount).toBe(0);
  });
});
