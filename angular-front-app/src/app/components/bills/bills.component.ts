import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GatewayService } from '../../services/gateway.service';
import { Bill, ProductItem } from '../../models/bill.model';
import { Customer } from '../../models/customer.model';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-bills',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <div class="card-header">
        <h2>Gestion des Factures</h2>
        <span class="badge">{{ bills.length }} facture(s)</span>
      </div>

      @if (errorMessage) {
        <div class="alert-error">{{ errorMessage }}</div>
      }

      <form (ngSubmit)="createBill()" style="margin-bottom: 24px; padding: 16px; background: #f8fafc; border-radius: 8px;">
        <h3 style="margin-bottom: 12px; font-size: 1rem;">Nouvelle Facture</h3>
        <div class="form-grid">
          <div class="form-group">
            <label for="billCustomer">Client</label>
            <select id="billCustomer" name="customerId" [(ngModel)]="selectedCustomerId" required>
              <option [ngValue]="null">-- Sélectionner un client --</option>
              @for (c of customers; track c.id) {
                <option [ngValue]="c.id">{{ c.name }} ({{ c.email }})</option>
              }
            </select>
          </div>
          <div class="form-group">
            <label for="billProduct">Produit</label>
            <select id="billProduct" name="productId" [(ngModel)]="selectedProductId" required>
              <option [ngValue]="null">-- Sélectionner un produit --</option>
              @for (p of products; track p.id) {
                <option [ngValue]="p.id">{{ p.name }} - {{ p.price | number:'1.2-2' }} MAD</option>
              }
            </select>
          </div>
          <div class="form-group">
            <label for="billQty">Quantité</label>
            <input id="billQty" name="quantity" type="number" min="1" [(ngModel)]="selectedQuantity" required />
          </div>
          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn btn-secondary" (click)="addItem()">+ Ligne</button>
            <button type="submit" class="btn btn-primary" [disabled]="!selectedCustomerId || draftItems.length === 0">
              Créer Facture
            </button>
          </div>
        </div>

        @if (draftItems.length > 0) {
          <div style="margin-top: 12px;">
            <strong>Lignes ajoutées :</strong>
            <ul style="margin-left: 20px; margin-top: 6px;">
              @for (item of draftItems; track $index) {
                <li>
                  Produit #{{ item.productId }} — Qté: {{ item.quantity }} — Prix unit: {{ item.price | number:'1.2-2' }} MAD
                </li>
              }
            </ul>
          </div>
        }
      </form>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Date</th>
            <th>Client</th>
            <th>Nb. Produits</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (b of bills; track b.id) {
            <tr>
              <td>#{{ b.id }}</td>
              <td>{{ b.billingDate | date:'dd/MM/yyyy HH:mm' }}</td>
              <td>{{ b.customer?.name ?? ('Client #' + b.customerId) }}</td>
              <td>{{ b.productItems.length }}</td>
              <td><strong>{{ b.total | number:'1.2-2' }} MAD</strong></td>
              <td>
                <button class="btn btn-primary" (click)="viewDetails(b.id!)">Détails</button>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="6" style="text-align: center; color: #64748b;">Aucune facture trouvée.</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class BillsComponent implements OnInit {
  private readonly gatewayService = inject(GatewayService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  bills: Bill[] = [];
  customers: Customer[] = [];
  products: Product[] = [];

  selectedCustomerId: number | null = null;
  selectedProductId: number | null = null;
  selectedQuantity = 1;
  draftItems: ProductItem[] = [];
  errorMessage = '';

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const customerId = params['customerId'];
      if (customerId) {
        this.loadBillsByCustomer(Number(customerId));
      } else {
        this.loadBills();
      }
    });
    this.gatewayService.getCustomers().subscribe({ next: (c) => (this.customers = c) });
    this.gatewayService.getProducts().subscribe({ next: (p) => (this.products = p) });
  }

  loadBills(): void {
    this.errorMessage = '';
    this.gatewayService.getBills().subscribe({
      next: (data) => (this.bills = data),
      error: () => (this.errorMessage = 'Impossible de charger les factures via la Gateway.')
    });
  }

  loadBillsByCustomer(customerId: number): void {
    this.errorMessage = '';
    this.gatewayService.getBillsByCustomer(customerId).subscribe({
      next: (data) => (this.bills = data),
      error: () => (this.errorMessage = 'Impossible de charger les factures du client.')
    });
  }

  addItem(): void {
    if (!this.selectedProductId || this.selectedQuantity < 1) return;
    const product = this.products.find((p) => p.id === this.selectedProductId);
    if (!product) return;

    this.draftItems.push({
      productId: product.id!,
      price: product.price,
      quantity: this.selectedQuantity
    });
    this.selectedProductId = null;
    this.selectedQuantity = 1;
  }

  createBill(): void {
    if (!this.selectedCustomerId || this.draftItems.length === 0) return;
    const payload: Bill = {
      customerId: this.selectedCustomerId,
      productItems: this.draftItems
    };
    this.gatewayService.createBill(payload).subscribe({
      next: () => {
        this.draftItems = [];
        this.selectedCustomerId = null;
        this.loadBills();
      },
      error: () => (this.errorMessage = 'Erreur lors de la création de la facture.')
    });
  }

  viewDetails(billId: number): void {
    this.router.navigate(['/bill-details', billId]);
  }
}
