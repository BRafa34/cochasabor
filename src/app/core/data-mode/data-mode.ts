import { computed, Injectable, signal } from '@angular/core';

export type DataMode = 'demo' | 'api';

@Injectable({ providedIn: 'root' })
export class DataModeService {
  private readonly currentMode = signal<DataMode>(this.restore());
  readonly mode = this.currentMode.asReadonly();
  readonly isApi = computed(() => this.currentMode() === 'api');

  set(mode: DataMode): void {
    try {
      localStorage.setItem('cochasabor.data-mode', mode);
    } catch {
      /* A storage failure must not prevent switching sources for this page. */
    }
    this.currentMode.set(mode);
  }

  toggle(): DataMode {
    const next = this.currentMode() === 'demo' ? 'api' : 'demo';
    this.set(next);
    return next;
  }

  private restore(): DataMode {
    try {
      return localStorage.getItem('cochasabor.data-mode') === 'api' ? 'api' : 'demo';
    } catch {
      return 'demo';
    }
  }
}
