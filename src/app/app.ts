import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppLayout } from './core/layout/app-layout/app-layout';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppLayout],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('expense-management');
}
