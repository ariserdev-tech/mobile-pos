import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { InventoryItem, Transaction, StoreSettings } from '../types';
import { dbAPI } from '../db';

interface StoreContextType {
  items: InventoryItem[];
  transactions: Transaction[];
  settings: StoreSettings;
  loading: boolean;
  refreshItems: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  addItem: (item: InventoryItem) => Promise<void>;
  updateItem: (item: InventoryItem) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  importInventory: (newItems: InventoryItem[], replace: boolean) => Promise<void>;
  addTransaction: (transaction: Transaction) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  updateSettings: (settings: StoreSettings) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children?: ReactNode }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({ 
    sellerName: '', 
    sellerAddress: '', 
    sellerContact: '',
    websiteUrl: '',
    returnPolicy: 'Returns accepted within 30 days with receipt.',
    printerAddress: ''
  });
  const [loading, setLoading] = useState(true);

  const refreshItems = async () => {
    const data = await dbAPI.getItems();
    setItems(data);
  };

  const refreshTransactions = async () => {
    const data = await dbAPI.getTransactions();
    // Sort by date desc
    setTransactions(data.sort((a, b) => b.timestamp - a.timestamp));
  };

  const refreshSettings = async () => {
    const data = await dbAPI.getSettings();
    setSettings(data);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const currentItems = await dbAPI.getItems();
      
      setItems(currentItems);
      await Promise.all([refreshTransactions(), refreshSettings()]);
      setLoading(false);
    };
    init();
  }, []);

  const addItem = async (item: InventoryItem) => {
    await dbAPI.saveItem(item);
    await refreshItems();
  };

  const updateItem = async (item: InventoryItem) => {
    await dbAPI.saveItem(item);
    await refreshItems();
  };

  const deleteItem = async (id: string) => {
    await dbAPI.deleteItem(id);
    await refreshItems();
  };

  const importInventory = async (newItems: InventoryItem[], replace: boolean) => {
    if (replace) {
      await dbAPI.clearItems();
    }
    for (const item of newItems) {
      await dbAPI.saveItem(item);
    }
    await refreshItems();
  };

  const addTransaction = async (transaction: Transaction) => {
    await dbAPI.saveTransaction(transaction);
    await refreshTransactions();
  };

  const updateTransaction = async (transaction: Transaction) => {
    await dbAPI.saveTransaction(transaction);
    await refreshTransactions();
  };

  const updateSettings = async (newSettings: StoreSettings) => {
    await dbAPI.saveSettings(newSettings);
    setSettings(newSettings);
  };

  return (
    <StoreContext.Provider
      value={{
        items,
        transactions,
        settings,
        loading,
        refreshItems,
        refreshTransactions,
        addItem,
        updateItem,
        deleteItem,
        importInventory,
        addTransaction,
        updateTransaction,
        updateSettings,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};