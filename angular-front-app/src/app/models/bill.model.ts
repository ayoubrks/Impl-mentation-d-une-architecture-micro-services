import { Customer } from './customer.model';
import { Product } from './product.model';

export interface ProductItem {
  id?: number;
  productId: number;
  price: number;
  quantity: number;
  product?: Product;
  amount?: number;
}

export interface Bill {
  id?: number;
  billingDate?: string;
  customerId: number;
  customer?: Customer;
  productItems: ProductItem[];
  total?: number;
}
