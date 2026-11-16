import { FormControl } from '@angular/forms';
import { commentValidator, ratingValidator } from '../../features/review-editor/review-editor';
import { ratingSummary, validPhoto, validReview } from './reviews';
describe('Review rules', () => {
  it('rejects whitespace comments, short comments and fractional ratings', () => {
    expect(validReview(5, '         ')).toBe(false);
    expect(validReview(2.5, 'Una reseña de ejemplo')).toBe(false);
    expect(validReview(6, 'Una reseña de ejemplo')).toBe(false);
    expect(validReview(1, 'Una reseña de ejemplo')).toBe(true);
    expect(commentValidator(new FormControl('          ', { nonNullable: true }))).toEqual({
      commentLength: true,
    });
    expect(ratingValidator(new FormControl(0, { nonNullable: true }))).toEqual({ rating: true });
  });
  it('honestly represents no reviews and calculates a coherent average', () => {
    expect(ratingSummary([])).toEqual({ ratingAverage: null, reviewCount: 0 });
    const base = {
      id: 'a',
      placeId: 'p',
      userId: 'u',
      displayName: 'Demo',
      comment: 'Buen lugar de ejemplo',
      createdAt: '2026-10-13T12:00:00Z',
    };
    expect(
      ratingSummary([
        { ...base, rating: 4 },
        { ...base, id: 'b', rating: 5 },
      ]),
    ).toEqual({ ratingAverage: 4.5, reviewCount: 2 });
  });
  it('rejects unsupported and oversized uploads', () => {
    expect(validPhoto(new File(['text'], 'photo.svg', { type: 'image/svg+xml' }))).toContain('JPG');
    expect(
      validPhoto(
        new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'photo.jpg', { type: 'image/jpeg' }),
      ),
    ).toContain('5 MB');
    expect(validPhoto(new File(['image'], 'photo.webp', { type: 'image/webp' }))).toBe('');
  });
});
