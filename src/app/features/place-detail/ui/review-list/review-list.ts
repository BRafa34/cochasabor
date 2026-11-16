import { Component, computed, effect, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Review } from '../../../../domains/reviews/reviews';
import { Rating } from '../../../../shared/ui/rating/rating';
@Component({
  selector: 'app-review-list',
  imports: [DatePipe, Rating],
  template: ` @if (!reviews().length) {
      <div class="empty">
        <h3>Cada lugar tiene una primera historia.</h3>
        <p>Sé la primera persona en compartir su experiencia.</p>
      </div>
    }
    @for (review of visible(); track review.id) {
      <article class="review">
        <div class="review-head">
          <span class="avatar" aria-hidden="true">{{ review.displayName.charAt(0) }}</span>
          <div>
            <h3>{{ review.displayName }}</h3>
            <span class="date">{{ review.createdAt | date: 'd MMM y' : '' : 'es' }} · Cuenta</span>
          </div>
          <app-rating [value]="review.rating" [count]="1" />
        </div>
        <p>{{ review.comment }}</p>
        @if (review.photo) {
          <img
            class="review-photo"
            [src]="review.photo"
            width="250"
            height="170"
            loading="lazy"
            alt="Fotografía adjunta a la reseña"
          />
        }
      </article>
    }
    @if (reviews().length > 3) {
      <div class="pager">
        <button class="button secondary" [disabled]="page() === 1" (click)="page.set(page() - 1)">
          Anteriores</button
        ><span>Página {{ page() }} de {{ pages() }}</span
        ><button
          class="button secondary"
          [disabled]="page() >= pages()"
          (click)="page.set(page() + 1)"
        >
          Siguientes
        </button>
      </div>
    }`,
  styles:
    '.review{padding:27px 0;border-bottom:1px solid var(--border)}.review-head{display:flex;align-items:center;gap:13px}.avatar{display:grid;place-items:center;width:42px;height:42px;background:#e8ecdf;border-radius:50%;color:var(--green);font-family:Georgia,serif;font-size:1.2rem;flex-shrink:0}h3{font-family:var(--sans);font-size:.85rem;font-weight:600;margin:0 0 5px}.date{font-size:.65rem;color:var(--muted)}.review-head app-rating{margin-left:auto}.review p{font-size:.86rem;line-height:1.8;margin:16px 0 0;color:#4e584b;white-space:pre-line;overflow-wrap:anywhere}.review-photo{object-fit:cover;border-radius:8px;margin-top:18px}.empty{padding:35px;background:#f0efe5;border-radius:10px;margin-top:20px}.empty h3{font:1.5rem Georgia,serif}.empty p{font-size:.83rem;color:var(--muted);line-height:1.7}.pager{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-top:25px}.pager span{font-size:.74rem;color:var(--muted)}@media(max-width:600px){.review-head{flex-wrap:wrap}.review-head app-rating{margin:8px 0 0 55px;width:100%}.pager{flex-wrap:wrap}.pager .button{font-size:.7rem;padding:10px 13px}.empty{padding:25px}}',
})
export class ReviewList {
  readonly reviews = input<Review[]>([]);
  readonly page = signal(1);
  readonly pages = computed(() => Math.ceil(this.reviews().length / 3));
  readonly visible = computed(() =>
    this.reviews().slice(
      (Math.min(this.page(), this.pages() || 1) - 1) * 3,
      Math.min(this.page(), this.pages() || 1) * 3,
    ),
  );
  constructor() {
    effect(() => {
      this.reviews();
      this.page.set(1);
    });
  }
}
