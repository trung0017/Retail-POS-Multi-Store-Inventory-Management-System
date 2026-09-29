export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  price: number;
  costPrice: number;
  unit: string;
  minStockThreshold: number;
  taxRate: number; // e.g. 0.08 for 8%
  description?: string;
  imageUrl?: string;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  isWarehouse: boolean;
}

export interface StockItem {
  branchId: string;
  productId: string;
  quantity: number;
  reserved: number;
  lastUpdated: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discountPercent: number; // 0 to 100
  notes?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'split' | 'digital_wallet';

export interface PaymentDetails {
  method: PaymentMethod;
  cashPaid: number;
  cardPaid: number;
  changeDue: number;
  cardReference?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  branchId: string;
  cashierName: string;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentDetails: PaymentDetails;
  status: 'completed' | 'synced' | 'pending_sync' | 'refunded';
  offlineCreated: boolean;
  createdAt: string;
  syncedAt?: string;
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  sourceBranchId: string;
  targetBranchId: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
  }[];
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ShiftSession {
  id: string;
  branchId: string;
  cashierName: string;
  openingFloat: number;
  openedAt: string;
  closedAt?: string;
  isClosed: boolean;
  cashSales: number;
  cardSales: number;
  totalSales: number;
  cashDrop: number;
  actualCountedCash?: number;
  discrepancy?: number;
  orderCount: number;
  notes?: string;
}
