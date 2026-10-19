import { create } from 'zustand';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { InventoryItem, InventoryPurchase, InventoryConsumption } from '../types/inventory';
import { useAuthStore } from './useAuthStore';
import { useLedgerStore } from './useLedgerStore';
import { logger } from '../services/logger';

interface InventoryStore {
  items: InventoryItem[];
  purchases: InventoryPurchase[];
  consumptions: InventoryConsumption[];
  isLoading: boolean;

  fetchItems: () => Promise<void>;
  createItem: (item: Partial<InventoryItem>) => Promise<void>;
  updateItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  purchaseStock: (purchase: Partial<InventoryPurchase>) => Promise<void>;
  issueStockToCrop: (consumption: Partial<InventoryConsumption>) => Promise<void>;
  fetchPurchases: () => Promise<void>;
  fetchConsumptions: () => Promise<void>;
  seedDefaultItems: () => Promise<void>;
}

const PRELOADED_ITEMS: Partial<InventoryItem>[] = [
  { name: 'Urea', nameMr: 'युरिया', type: 'fertilizer', unit: 'Kg', purchaseRate: 0, currentStock: 0 },
  { name: 'DAP', nameMr: 'डीएपी', type: 'fertilizer', unit: 'Kg', purchaseRate: 0, currentStock: 0 },
  { name: 'MOP (Potash)', nameMr: 'पोटॅश', type: 'fertilizer', unit: 'Kg', purchaseRate: 0, currentStock: 0 },
  { name: 'SSP', nameMr: 'एसएसपी', type: 'fertilizer', unit: 'Kg', purchaseRate: 0, currentStock: 0 },
  { name: '10-26-26', nameMr: '१०-२६-२६', type: 'fertilizer', unit: 'Kg', purchaseRate: 0, currentStock: 0 },
  { name: '20-20-0', nameMr: '२०-२०-०', type: 'fertilizer', unit: 'Kg', purchaseRate: 0, currentStock: 0 },
  { name: 'Micronutrients', nameMr: 'सूक्ष्म अन्नद्रव्ये', type: 'fertilizer', unit: 'Kg', purchaseRate: 0, currentStock: 0 },
  { name: 'Organic Manure', nameMr: 'सेंद्रिय खत', type: 'fertilizer', unit: 'Kg', purchaseRate: 0, currentStock: 0 },
  { name: 'Soybean Seeds', nameMr: 'सोयाबीन बियाणे', type: 'seed', unit: 'Kg', purchaseRate: 0, currentStock: 0 },
  { name: 'Cotton Seeds', nameMr: 'कापूस बियाणे', type: 'seed', unit: 'Packet', purchaseRate: 0, currentStock: 0 },
  { name: 'Wheat Seeds', nameMr: 'गहू बियाणे', type: 'seed', unit: 'Kg', purchaseRate: 0, currentStock: 0 },
  { name: 'Onion Seeds', nameMr: 'कांदा बियाणे', type: 'seed', unit: 'Kg', purchaseRate: 0, currentStock: 0 },
  { name: 'Rice Seeds', nameMr: 'भात बियाणे', type: 'seed', unit: 'Kg', purchaseRate: 0, currentStock: 0 },
  { name: 'Imidacloprid', nameMr: 'इमिडाक्लोप्रिड', type: 'pesticide', unit: 'Ltr', purchaseRate: 0, currentStock: 0 },
  { name: 'Chlorpyrifos', nameMr: 'क्लोरपायरीफॉस', type: 'pesticide', unit: 'Ltr', purchaseRate: 0, currentStock: 0 },
  { name: 'Mancozeb', nameMr: 'मॅन्कोझेब', type: 'pesticide', unit: 'Kg', purchaseRate: 0, currentStock: 0 },
  { name: 'Carbendazim', nameMr: 'कार्बेन्डाझिम', type: 'pesticide', unit: 'Kg', purchaseRate: 0, currentStock: 0 },
  { name: 'Neem Oil', nameMr: 'निंबोळी अर्क', type: 'pesticide', unit: 'Ltr', purchaseRate: 0, currentStock: 0 },
  { name: 'Other Input', nameMr: 'इतर', type: 'other', unit: 'Kg', purchaseRate: 0, currentStock: 0 },
];

function getUserMobile(): string {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error('User not authenticated');
  return user.mobileNumber;
}

function getItemsRef() {
  return collection(db, 'users', getUserMobile(), 'inventory_items');
}

function getPurchasesRef() {
  return collection(db, 'users', getUserMobile(), 'inventory_purchases');
}

function getConsumptionsRef() {
  return collection(db, 'users', getUserMobile(), 'inventory_consumptions');
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  items: [],
  purchases: [],
  consumptions: [],
  isLoading: false,

  fetchItems: async () => {
    set({ isLoading: true });
    try {
      const snap = await getDocs(getItemsRef());
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as InventoryItem));
      set({ items, isLoading: false });
      if (items.length === 0) {
        await get().seedDefaultItems();
      }
    } catch (err) {
      logger.error('fetchItems error:', err);
      set({ isLoading: false });
    }
  },

  createItem: async (item: Partial<InventoryItem>) => {
    const now = Timestamp.now();
    const data = { ...item, currentStock: item.currentStock || 0, createdAt: now, updatedAt: now };
    const docRef = await addDoc(getItemsRef(), data);
    set((s) => ({ items: [...s.items, { id: docRef.id, ...data } as InventoryItem] }));
  },

  updateItem: async (id: string, updates: Partial<InventoryItem>) => {
    const updateData = { ...updates, updatedAt: Timestamp.now() };
    await updateDoc(doc(getItemsRef(), id), updateData);
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, ...updateData } as InventoryItem : i)),
    }));
  },

  deleteItem: async (id: string) => {
    await deleteDoc(doc(getItemsRef(), id));
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
  },

  purchaseStock: async (purchase: Partial<InventoryPurchase>) => {
    const now = Timestamp.now();
    const data = { ...purchase, createdAt: now, updatedAt: now };
    const docRef = await addDoc(getPurchasesRef(), data);

    // Increase stock quantity (Purchase ≠ Expense — Business Rule #1)
    const item = get().items.find((i) => i.id === purchase.itemId);
    if (item) {
      const newStock = item.currentStock + (purchase.quantity || 0);
      const newRate = purchase.rate || item.purchaseRate;
      await get().updateItem(item.id, { currentStock: newStock, purchaseRate: newRate });
    }

    set((s) => ({
      purchases: [{ id: docRef.id, ...data } as InventoryPurchase, ...s.purchases],
    }));
  },

  issueStockToCrop: async (consumption: Partial<InventoryConsumption>) => {
    const item = get().items.find((i) => i.id === consumption.itemId);
    if (!item) throw new Error('Item not found');

    // Business Rule #12: Stock sufficiency check
    if ((consumption.quantity || 0) > item.currentStock) {
      throw new Error('Insufficient stock');
    }

    const rate = consumption.rate || item.purchaseRate;
    const totalAmount = (consumption.quantity || 0) * rate;
    const now = Timestamp.now();
    const data = { ...consumption, rate, totalAmount, createdAt: now, updatedAt: now };
    const docRef = await addDoc(getConsumptionsRef(), data);

    // Deduct from stock
    await get().updateItem(item.id, {
      currentStock: item.currentStock - (consumption.quantity || 0),
    });

    // Business Rule #2: Issue to Crop = Real Expense — auto-post expense entry
    await useLedgerStore.getState().createTransaction({
      type: 'expense',
      ledgerType: 'agriculture',
      category: item.type === 'fertilizer' ? 'Fertilizers' : item.type === 'seed' ? 'Seeds' : item.type === 'pesticide' ? 'Pesticides' : 'Other Agri',
      amount: totalAmount,
      date: consumption.date || new Date().toISOString().split('T')[0],
      paymentMode: 'cash',
      plotId: consumption.plotId,
      plotName: consumption.plotName,
      cropId: consumption.cropId,
      cropName: consumption.cropName,
      notes: `${item.name} - ${consumption.quantity} ${item.unit} @ ₹${rate}`,
      isAutoGenerated: true,
      autoEntryType: 'inventory_issue',
      isLocked: true,
    });

    set((s) => ({
      consumptions: [{ id: docRef.id, ...data } as InventoryConsumption, ...s.consumptions],
    }));
  },

  fetchPurchases: async () => {
    try {
      const q = query(getPurchasesRef(), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      set({ purchases: snap.docs.map((d) => ({ id: d.id, ...d.data() } as InventoryPurchase)) });
    } catch (err) {
      logger.error('fetchPurchases error:', err);
    }
  },

  fetchConsumptions: async () => {
    try {
      const q = query(getConsumptionsRef(), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      set({ consumptions: snap.docs.map((d) => ({ id: d.id, ...d.data() } as InventoryConsumption)) });
    } catch (err) {
      logger.error('fetchConsumptions error:', err);
    }
  },

  seedDefaultItems: async () => {
    for (const item of PRELOADED_ITEMS) {
      await get().createItem(item);
    }
  },
}));
