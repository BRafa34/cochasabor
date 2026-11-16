import { CatalogFilters, Page, PlaceSummary } from './places';
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .trim();
}
export function parseFilters(
  params: Record<string, string | undefined>,
  categories: string[],
): CatalogFilters {
  const page = Number(params['pagina']);
  const order = params['orden'];
  return {
    q: (params['q'] ?? '').slice(0, 120),
    categoria: categories.includes(params['categoria'] ?? '') ? params['categoria']! : '',
    orden: order === 'nombre' || order === 'valoracion' ? order : 'recomendados',
    pagina: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}
export function filterPlaces(
  places: PlaceSummary[],
  filters: CatalogFilters,
  pageSize = 6,
): Page<PlaceSummary> {
  const q = normalizeText(filters.q);
  const matches = places.filter(
    (p) =>
      (!filters.categoria || p.categoryIds.includes(filters.categoria)) &&
      normalizeText(`${p.name} ${p.zone} ${p.description}`).includes(q),
  );
  matches.sort((a, b) =>
    filters.orden === 'nombre'
      ? a.name.localeCompare(b.name, 'es')
      : filters.orden === 'valoracion'
        ? (b.ratingAverage ?? -1) - (a.ratingAverage ?? -1)
        : Number(b.featured) - Number(a.featured),
  );
  const page = Math.min(filters.pagina, Math.max(1, Math.ceil(matches.length / pageSize)));
  return {
    items: matches.slice((page - 1) * pageSize, page * pageSize),
    total: matches.length,
    page,
    pageSize,
  };
}
