import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GatewayService } from '../../services/gateway.service';
import { Bill } from '../../models/bill.model';

@Component({
  selector: 'app-bill-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="card">
      <div class="card-header">
        <h2>Détails de la Facture #{{ bill?.id }}</h2>
        <a routerLink="/bills" class="btn btn-secondary">Retour aux factures</a>
      </div>

      @if (errorMessage) {
        <div class="alert-error">{{ errorMessage }}</div>
      }

      @if (bill) {
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
          <div style="padding: 14px; background: #f8fafc; border-radius: 8px;">
            <h3 style="font-size: 1rem; margin-bottom: 8px;">Informations Facture</h3>
            <p><strong>ID :</strong> {{ bill.id }}</p>
            <p><strong>Date :</strong> {{ bill.billingDate | date:'dd/MM/yyyy HH:mm' }}</p>
          </div>
          <div style="padding: 14px; background: #f8fafc; border-radius: 8px;">
            <h3 style="font-size: 1rem; margin-bottom: 8px;">Client</h3>
            <p><strong>ID :</strong> {{ bill.customer?.id ?? bill.customerId }}</p>
            <p><strong>Nom :</strong> {{ bill.customer?.name ?? 'N/A' }}</p>
            <p><strong>Email :</strong> {{ bill.customer?.email ?? 'N/A' }}</p>
          </div>
        </div>

        <h3 style="margin-bottom: 12px;">Produits facturés</h3>
        <table>
          <thead>
            <tr>
              <th>Produit ID</th>
              <th>Désignation</th>
              <th>Prix Unitaire</th>
              <th>Quantité</th>
              <th>Montant</th>
            </tr>
          </thead>
          <tbody>
            @for (item of bill.productItems; track item.id) {
              <tr>
                <td>{{ item.productId }}</td>
                <td>{{ item.product?.name ?? ('Produit #' + item.productId) }}</td>
                <td>{{ item.price | number:'1.2-2' }} MAD</td>
                <td>{{ item.quantity }}</td>
                <td><strong>{{ (item.amount ?? item.price * item.quantity) | number:'1.2-2' }} MAD</strong></td>
              </tr>
            }
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" style="text-align: right; font-weight: 700;">TOTAL FACTURE :</td>
              <td style="font-weight: 700; font-size: 1.1rem; color: #2563eb;">
                {{ bill.total | number:'1.2-2' }} MAD
              </td>
            </tr>
          </tfoot>
        </table>
      }
    </div>
  `
})
export class BillDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly gatewayService = inject(GatewayService);

  bill: Bill | null = null;
  errorMessage = '';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.gatewayService.getFullBill(id).subscribe({
        next: (data) => (this.bill = data),
        error: () => (this.errorMessage = 'Impossible de charger les détails de la facture.')
      });
    }
  }
}
