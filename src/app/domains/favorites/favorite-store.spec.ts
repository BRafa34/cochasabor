import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Session } from '../../core/session/session';
import { FavoriteStore } from './favorite-store';
describe('Demo favorites', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });
  it('synchronizes saves, restores them and hides them after sign-out or profile change', () => {
    const session = TestBed.inject(Session);
    session.enter('Perfil Uno');
    const favorites = TestBed.inject(FavoriteStore);
    favorites.toggle('p1');
    expect(favorites.ids()).toEqual(['p1']);
    session.leave();
    expect(favorites.ids()).toEqual([]);
    session.enter('Perfil Dos');
    expect(favorites.ids()).toEqual([]);
    session.enter('Perfil Uno');
    expect(favorites.ids()).toEqual(['p1']);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const restored = TestBed.inject(FavoriteStore);
    expect(restored.has('p1')).toBe(true);
    restored.toggle('p1');
    expect(restored.ids()).toEqual([]);
  });
});
