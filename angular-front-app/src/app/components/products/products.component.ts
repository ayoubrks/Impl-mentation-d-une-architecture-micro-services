import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GatewayService } from '../../services/gateway.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <div class="card-header">
        <h2>Gestion des Produits (Inventaire)</h2>
        <span class="badge">{{ products.length }} produit(s)</span>
      </div>

      @if (errorMessage) {
        <div class="alert-error">{{ errorMessage }}</div>
      }

      <form (ngSubmit)="addProduct()" class="form-grid" style="margin-bottom: 20px;">
        <div class="form-group">
          <label for="productName">Nom du produit</label>
          <input id="productName" name="name" [(ngModel)]="newProduct.name" required placeholder="Ex: Écran 27 pouces" />
        </div>
        <div class="form-group">
          <label for="productPrice">Prix (MAD)</label>
          <input id="productPrice" name="price" type="number" min="0" step="0.01" [(ngModel)]="newProduct.price" required />
        </div>
        <div class="form-group">
          <label for="productQty">Quantité</label>
          <input id="productQty" name="quantity" type="number" min="0" [(ngModel)]="newProduct.quantity" required />
        </div>
        <div>
          <button type="submit" class="btn btn-primary">Ajouter Produit</button>
        </div>
      </form>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nom</th>
            <th>Prix</th>
            <th>Quantité</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (p of products; track p.id) {
            <tr>
              <td>{{ p.id }}</td>
              <td>{{ p.name }}</td>
              <td>{{ p.price | number:'1.2-2' }} MAD</td>
              <td>{{ p.quantity }}</td>
              <td>
                <button class="btn btn-danger" (click)="deleteProduct(p.id!)">Supprimer</button>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="5" style="text-align: center; color: #64748b;">Aucun produit trouvé.</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class ProductsComponent implements OnInit {
  private readonly gatewayService = inject(GatewayService);

  products: Product[] = [];
  newProduct: Product = { name: '', price: 0, quantity: 1 };
  errorMessage = '';

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.errorMessage = '';
    this.gatewayService.getProducts().subscribe({
      next: (data) => (this.products = data),
      error: () => (this.errorMessage = 'Impossible de charger les produits via la Gateway (port 8888).')
    });
  }

  addProduct(): void {
    if (!this.newProduct.name.trim()) return;
    this.gatewayService.createProduct(this.newProduct).subscribe({
      next: () => {
        this.newProduct = { name: '', price: 0, quantity: 1 };
        this.loadProducts();
      },
      error: () => (this.errorMessage = 'Erreur lors de la création du produit.')
    });
  }

  deleteProduct(id: number): void {
    this.gatewayService.deleteProduct(id).subscribe({
      next: () => this.loadProducts(),
      error: () => (this.errorMessage = 'Erreur lors de la suppression du produit.')
    });
  }
}
