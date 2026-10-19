import { Timestamp } from 'firebase/firestore';

export type InventoryItemType = 'fertilizer' | 'seed' | 'pesticide' | 'other';

export interface InventoryItem {
  id: string;
  name: string;
  nameMr?: string;
  type: InventoryItemType;
  unit: string;
  purchaseRate: number;
  currentStock: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface InventoryPurchase {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  rate: number;
  totalAmount: number;
  supplierName?: string;
  paymentMode: 'cash' | 'bank' | 'upi' | 'credit' | 'cheque';
  date: string;
  billNumber?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface InventoryConsumption {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  rate: number;
  totalAmount: number;
  plotId: string;
  plotName: string;
  cropId: string;
  cropName: string;
  date: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
