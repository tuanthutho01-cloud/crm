
export enum TabType {
  DASHBOARD = 'dashboard',
  POS = 'pos',
  INVOICES = 'invoices',
  SEARCH = 'search',
  CUSTOMERS = 'customers',
  PRODUCTS = 'products'
}

export enum InvoiceType {
  QUOTE = 'quote',
  ORDER = 'order',
  SALE = 'sale',
  RETURN = 'return',
  PAYMENT = 'payment'
}

// Giả lập cấu trúc Timestamp để không làm hỏng logic format ngày tháng hiện tại
export interface LocalTimestamp {
  seconds: number;
  nanoseconds: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalDebt: number;
  createdAt?: LocalTimestamp;
  lastTransaction?: LocalTimestamp;
}

export interface Product {
  id: string;
  name: string;
  unit: string;
  defaultPrice: number;
  stock: number;
  createdAt?: LocalTimestamp;
}

export interface InvoiceItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
  isCustomPrice?: boolean;
}

export interface Invoice {
  id: string;
  code?: string;
  type: InvoiceType;
  customerId: string;
  customerName?: string;
  items: InvoiceItem[];
  totalAmount: number;
  paidAmount: number;
  status: 'active' | 'open' | 'pending' | 'cancelled';
  note?: string;
  createdAt: LocalTimestamp;
  dueDate?: LocalTimestamp | null;
}

export interface CustomPrice {
  price: number;
  updatedAt: LocalTimestamp;
}
