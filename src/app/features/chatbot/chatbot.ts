import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChatbotApi, ChatMessage } from '../../domains/chatbot/chatbot-api';
import { Icon } from '../../shared/ui/icon/icon';

interface VisibleMessage extends ChatMessage {
  id: number;
  error?: boolean;
}

@Component({
  selector: 'app-chatbot',
  imports: [ReactiveFormsModule, Icon],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.scss',
})
export class Chatbot {
  private readonly api = inject(ChatbotApi);
  readonly open = signal(false);
  readonly sending = signal(false);
  readonly messages = signal<VisibleMessage[]>([
    {
      id: 0,
      role: 'assistant',
      content:
        '¡Hola! Puedo ayudarte con los lugares y las funciones de CochaSabor. ¿Qué quieres saber?',
    },
  ]);
  readonly form = new FormGroup({
    message: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(700)],
    }),
  });

  close(): void {
    this.open.set(false);
  }

  async send(): Promise<void> {
    if (this.form.invalid || this.sending()) return;
    const content = this.form.controls.message.value.trim();
    if (!content) return;

    const userMessage: VisibleMessage = { id: Date.now(), role: 'user', content };
    const next = [...this.messages(), userMessage].slice(-100);
    this.messages.set(next);
    this.form.reset();
    this.sending.set(true);

    try {
      const answer = await this.api.send(
        next
          .filter((message) => !message.error)
          .slice(-8)
          .map(({ role, content: messageContent }) => ({
            role,
            content: messageContent,
          })),
      );
      const responseMessage: VisibleMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: answer,
      };
      this.messages.update((current) => [...current, responseMessage].slice(-100));
    } catch (error) {
      const errorMessage: VisibleMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: error instanceof Error ? error.message : 'No pudimos contactar al asistente.',
        error: true,
      };
      this.messages.update((current) => [...current, errorMessage].slice(-100));
    } finally {
      this.sending.set(false);
    }
  }
}
