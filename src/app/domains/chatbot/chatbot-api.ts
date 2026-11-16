import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable({ providedIn: 'root' })
export class ChatbotApi {
  private readonly http = inject(HttpClient);

  async send(messages: ChatMessage[]): Promise<string> {
    try {
      const result = await firstValueFrom(
        this.http.post<{ answer: string }>(`${API_BASE_URL}/chat`, { messages }),
      );
      return result.answer;
    } catch (error) {
      if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
        throw new Error(error.error.message, { cause: error });
      }
      throw new Error('No pudimos conectar con el asistente. Vuelve a intentarlo.', {
        cause: error,
      });
    }
  }
}
