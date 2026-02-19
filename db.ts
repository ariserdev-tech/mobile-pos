import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { InventoryItem, Transaction, StoreSettings } from './types';

interface SettingItem {
  key: string;
  value: any;
}

interface SalesPOSDB extends DBSchema {
  items: {
    key: string;
    value: InventoryItem;
  };
  transactions: {
    key: string;
    value: Transaction;
    indexes: { 'by-date': number };
  };
  settings: {
    key: string;
    value: SettingItem;
  };
}

const DB_NAME = 'sales-pos-db';
const DB_VERSION = 1;

export const initDB = async (): Promise<IDBPDatabase<SalesPOSDB>> => {
  return openDB<SalesPOSDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('items')) {
        db.createObjectStore('items', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('transactions')) {
        const store = db.createObjectStore('transactions', { keyPath: 'id' });
        store.createIndex('by-date', 'timestamp');
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    },
  });
};

export const dbAPI = {
  async getItems(): Promise<InventoryItem[]> {
    const db = await initDB();
    return db.getAll('items');
  },
  async saveItem(item: InventoryItem) {
    const db = await initDB();
    return db.put('items', item);
  },
  async deleteItem(id: string) {
    const db = await initDB();
    return db.delete('items', id);
  },
  async clearItems() {
    const db = await initDB();
    return db.clear('items');
  },
  async getTransactions(): Promise<Transaction[]> {
    const db = await initDB();
    return db.getAllFromIndex('transactions', 'by-date');
  },
  async saveTransaction(transaction: Transaction) {
    const db = await initDB();
    return db.put('transactions', transaction);
  },
  async getSettings(): Promise<StoreSettings> {
    const db = await initDB();
    const nameRecord = await db.get('settings', 'sellerName');
    const addressRecord = await db.get('settings', 'sellerAddress');
    const contactRecord = await db.get('settings', 'sellerContact');
    const websiteRecord = await db.get('settings', 'websiteUrl');
    const policyRecord = await db.get('settings', 'returnPolicy');
    const pAddrRecord = await db.get('settings', 'printerAddress');
    
    return {
      sellerName: nameRecord?.value || '',
      sellerAddress: addressRecord?.value || '',
      sellerContact: contactRecord?.value || '',
      websiteUrl: websiteRecord?.value || '',
      returnPolicy: policyRecord?.value || 'Returns accepted within 30 days with receipt.',
      printerAddress: pAddrRecord?.value || '',
    };
  },
  async saveSettings(settings: StoreSettings) {
    const db = await initDB();
    await db.put('settings', { key: 'sellerName', value: settings.sellerName });
    await db.put('settings', { key: 'sellerAddress', value: settings.sellerAddress });
    await db.put('settings', { key: 'sellerContact', value: settings.sellerContact });
    await db.put('settings', { key: 'websiteUrl', value: settings.websiteUrl });
    await db.put('settings', { key: 'returnPolicy', value: settings.returnPolicy });
    await db.put('settings', { key: 'printerAddress', value: settings.printerAddress });
  },
};