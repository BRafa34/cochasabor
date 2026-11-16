import { Session, internalReturn } from './session';
describe('Demo session', () => {
  beforeEach(() => localStorage.clear());
  it('restores a demo profile without storing credentials and removes it on sign-out', () => {
    const session = new Session();
    session.enter('Explorador');
    expect(new Session().profile()?.name).toBe('Explorador');
    expect(Object.keys(JSON.parse(localStorage.getItem('cochasabor.profile')!))).toEqual([
      'id',
      'name',
    ]);
    session.leave();
    expect(new Session().profile()).toBeNull();
  });
  it('preserves useful internal return URLs and rejects external destinations', () => {
    expect(internalReturn('/lugares/cafe-del-patio/resena?volver=%2Flugares')).toContain('/resena');
    expect(internalReturn('https://example.com')).toBe('/favoritos');
    expect(internalReturn('//example.com')).toBe('/favoritos');
    expect(internalReturn('/lugares\\example.com')).toBe('/favoritos');
  });
});
