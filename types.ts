export interface InventoryItem {
  id: string;
  name: string;
  aliases: string;
  basePrice: number;
  sellingPrice: number;
}

export interface CartItem extends InventoryItem {
  quantity: number;
  manualTotal?: number; // Override total price
}

export interface CustomerInfo {
  name: string;
  address: string;
  contact: string;
}

export interface PaymentRecord {
  date: number;
  amount: number;
}

export interface Transaction {
  id: string;
  timestamp: number;
  items: CartItem[];
  total: number;
  amountPaid: number;
  changeDue: number;
  remainingBalance: number;
  paymentType: string;
  customer?: CustomerInfo;
  isPaid: boolean;
  paymentHistory?: PaymentRecord[];
  sellerInfo: {
    name: string;
    address: string;
    contact?: string;
    websiteUrl?: string;
    returnPolicy?: string;
  };
}

export interface StoreSettings {
  sellerName: string;
  sellerAddress: string;
  sellerContact: string;
  websiteUrl: string;
  returnPolicy: string;
  printerAddress: string; // Generic field for MAC, IP, or Target Name
}

export type Tab = 'sales' | 'admin' | 'inventory' | 'settings';