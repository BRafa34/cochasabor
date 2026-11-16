import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api';

@Injectable({ providedIn: 'root' })
export class ReviewsApi {
  private readonly http = inject(HttpClient);

  async create(placeId: string, rating: number, comment: string): Promise<void> {
    await firstValueFrom(
      this.http.post(
        `${API_BASE_URL}/places/${encodeURIComponent(placeId)}/reviews`,
        { rating, comment },
        { withCredentials: true },
      ),
    );
  }
}
