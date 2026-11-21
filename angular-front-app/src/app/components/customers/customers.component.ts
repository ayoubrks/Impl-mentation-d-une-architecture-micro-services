import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GatewayService } from '../../services/gateway.service';
import { Customer } from '../../models/customer.model';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <div class="card-header">
        <h2>Gestion des Clients</h2>
        <span class="badge">{{ customers.length }} client(s)</span>
      </div>

      @if (errorMessage) {
        <div class="alert-error">{{ errorMessage }}</div>
      }

      <form (ngSubmit)="addCustomer()" class="form-grid" style="margin-bottom: 20px;">
        <div class="form-group">
          <label for="customerName">Nom</label>
          <input id="customerName" name="name" [(ngModel)]="newCustomer.name" required placeholder="Ex: Yassine" />
        </div>
        <div class="form-group">
          <label for="customerEmail">Email</label>
          <input id="customerEmail" name="email" type="email" [(ngModel)]="newCustomer.email" required placeholder="Ex: yassine@gmail.com" />
        </div>
        <div>
          <button type="submit" class="btn btn-primary">Ajouter Client</button>
        </div>
      </form>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nom</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (c of customers; track c.id) {
            <tr>
              <td>{{ c.id }}</td>
              <td>{{ c.name }}</td>
              <td>{{ c.email }}</td>
              <td style="display: flex; gap: 8px;">
                <button class="btn btn-secondary" (click)="viewBills(c.id!)">Factures</button>
                <button class="btn btn-danger" (click)="deleteCustomer(c.id!)">Supprimer</button>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="4" style="text-align: center; color: #64748b;">Aucun client trouvé.</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class CustomersComponent implements OnInit {
  private readonly gatewayService = inject(GatewayService);
  private readonly router = inject(Router);

  customers: Customer[] = [];
  newCustomer: Customer = { name: '', email: '' };
  errorMessage = '';

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.errorMessage = '';
    this.gatewayService.getCustomers().subscribe({
      next: (data) => (this.customers = data),
      error: () => (this.errorMessage = 'Impossible de charger les clients via la Gateway (port 8888).')
    });
  }

  addCustomer(): void {
    if (!this.newCustomer.name.trim() || !this.newCustomer.email.trim()) return;
    this.gatewayService.createCustomer(this.newCustomer).subscribe({
      next: () => {
        this.newCustomer = { name: '', email: '' };
        this.loadCustomers();
      },
      error: () => (this.errorMessage = 'Erreur lors de la création du client.')
    });
  }

  deleteCustomer(id: number): void {
    this.gatewayService.deleteCustomer(id).subscribe({
      next: () => this.loadCustomers(),
      error: () => (this.errorMessage = 'Erreur lors de la suppression du client.')
    });
  }

  viewBills(customerId: number): void {
    this.router.navigate(['/bills'], { queryParams: { customerId } });
  }
}
