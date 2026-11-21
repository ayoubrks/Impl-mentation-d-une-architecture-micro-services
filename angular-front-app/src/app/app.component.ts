import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav style="background: #0f172a; color: #fff; padding: 14px 24px; display: flex; align-items: center; justify-content: space-between;">
      <div style="font-weight: 700; font-size: 1.15rem; letter-spacing: 0.3px;">
        Microservices Billing App
      </div>
      <div style="display: flex; gap: 16px;">
        <a routerLink="/customers" routerLinkActive="active-link"
           style="color: #cbd5e1; text-decoration: none; font-weight: 500; padding: 6px 10px; border-radius: 6px;">
          Clients
        </a>
        <a routerLink="/products" routerLinkActive="active-link"
           style="color: #cbd5e1; text-decoration: none; font-weight: 500; padding: 6px 10px; border-radius: 6px;">
          Produits
        </a>
        <a routerLink="/bills" routerLinkActive="active-link"
           style="color: #cbd5e1; text-decoration: none; font-weight: 500; padding: 6px 10px; border-radius: 6px;">
          Factures
        </a>
      </div>
    </nav>

    <main class="container">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .active-link {
      background-color: #2563eb;
      color: #ffffff !important;
    }
  `]
})
export class AppComponent {}
