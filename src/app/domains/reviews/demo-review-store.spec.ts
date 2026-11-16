import 'fake-indexeddb/auto';
import { DemoReviewStore } from './demo-review-store';
import { Review } from './reviews';
describe('Local demonstration persistence', () => {
  it('persists a review and its photo after restoring the store, and rejects duplicates', async () => {
    const store = new DemoReviewStore();
    const review: Review = {
      id: 'test-user:p1',
      placeId: 'p1',
      userId: 'test-user',
      displayName: 'Demo Test',
      rating: 5,
      comment: 'Una reseña de prueba con foto.',
      createdAt: '2026-10-13T12:00:00Z',
      photo: 'data:image/webp;base64,UklGRg==',
    };
    await store.save(review, []);
    const restored = new DemoReviewStore();
    await restored.whenReady();
    expect(restored.reviews().find((r) => r.id === review.id)).toEqual(review);
    await expect(restored.save({ ...review, id: 'another-id' }, [])).rejects.toThrow(
      'Ya escribiste',
    );
    await expect(
      restored.save({ ...review, id: 'invalid', placeId: 'p2', rating: 0 }, []),
    ).rejects.toThrow('Comprueba');
  });
});
