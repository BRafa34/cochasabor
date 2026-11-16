import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './layout/header/header';
import { Footer } from './layout/footer/footer';
import { DataModeService } from './core/data-mode/data-mode';
import { Chatbot } from './features/chatbot/chatbot';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, Chatbot],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly mode = inject(DataModeService);
}
