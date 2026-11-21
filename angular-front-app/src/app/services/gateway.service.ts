import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Customer } from '../models/customer.model';
import { Product } from '../models/product.model';
import { Bill } from '../models/bill.model';

interface HalResponse<T> {
  _embedded?: Record<string, T[]>;
}

@Injectable({
  providedIn: 'root'
})
export class GatewayService {
  private readonly http = inject(HttpClient);
  private readonly gatewayUrl = 'http://localhost:8888';

  // --- Customers ---
  getCustomers(): Observable<Customer[]> {
    return this.http
      .get<HalResponse<Customer>>(`${this.gatewayUrl}/customer-service/api/customers`)
      .pipe(map((res) => res._embedded?.['customers'] ?? []));
  }

  createCustomer(customer: Customer): Observable<Customer> {
    return this.http.post<Customer>(`${this.gatewayUrl}/customer-service/api/customers`, customer);
  }

  deleteCustomer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.gatewayUrl}/customer-service/api/customers/${id}`);
  }

  // --- Products (Inventory) ---
  getProducts(): Observable<Product[]> {
    return this.http
      .get<HalResponse<Product>>(`${this.gatewayUrl}/inventory-service/api/products`)
      .pipe(map((res) => res._embedded?.['products'] ?? []));
  }

  createProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(`${this.gatewayUrl}/inventory-service/api/products`, product);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.gatewayUrl}/inventory-service/api/products/${id}`);
  }

  // --- Bills (Billing) ---
  getBills(): Observable<Bill[]> {
    return this.http.get<Bill[]>(`${this.gatewayUrl}/billing-service/fullBills`);
  }

  getBillsByCustomer(customerId: number): Observable<Bill[]> {
    return this.http.get<Bill[]>(`${this.gatewayUrl}/billing-service/bills/byCustomer/${customerId}`);
  }

  getFullBill(id: number): Observable<Bill> {
    return this.http.get<Bill>(`${this.gatewayUrl}/billing-service/fullBill/${id}`);
  }

  createBill(bill: Bill): Observable<Bill> {
    return this.http.post<Bill>(`${this.gatewayUrl}/billing-service/fullBills`, bill);
  }
}
