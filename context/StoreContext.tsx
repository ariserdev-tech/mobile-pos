import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { InventoryItem, Transaction, StoreSettings, Tab } from '../types';
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
  deleteTransaction: (id: string) => Promise<void>;
  updateSettings: (settings: StoreSettings) => Promise<void>;
  exportData: () => Promise<void>;
  importData: (json: any) => Promise<void>;
  clearAllData: () => Promise<void>;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
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
  const [activeTab, setActiveTab] = useState<Tab>('sales');

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

  const deleteTransaction = async (id: string) => {
    await dbAPI.deleteTransaction(id);
    await refreshTransactions();
  };

  const updateSettings = async (newSettings: StoreSettings) => {
    await dbAPI.saveSettings(newSettings);
    setSettings(newSettings);
  };

  const exportData = async () => {
    const backup = await dbAPI.getFullBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pos_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importData = async (json: any) => {
    await dbAPI.restoreFullBackup(json);
    await Promise.all([refreshItems(), refreshTransactions(), refreshSettings()]);
  };

  const clearAllData = async () => {
    await dbAPI.clearAllData();
    setItems([]);
    setTransactions([]);
    setSettings({ 
      sellerName: '', 
      sellerAddress: '', 
      sellerContact: '',
      websiteUrl: '',
      returnPolicy: 'Returns accepted within 30 days with receipt.',
      printerAddress: ''
    });
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
        deleteTransaction,
        updateSettings,
        exportData,
        importData,
        clearAllData,
        activeTab,
        setActiveTab,
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