import React, { useState } from 'react';
import { StoreProvider } from './context/StoreContext';
import Sales from './pages/Sales';
import Admin from './pages/Admin';
import Inventory from './pages/Inventory';
import Settings from './pages/Settings';
import { Tab } from './types';
import { ShoppingBag, LayoutDashboard, Package, Settings as SettingsIcon } from 'lucide-react';

const AppContent = () => {
  const [activeTab, setActiveTab] = useState<Tab>('sales');

  const renderPage = () => {
    switch (activeTab) {
      case 'sales': return <Sales />;
      case 'admin': return <Admin />;
      case 'inventory': return <Inventory />;
      case 'settings': return <Settings />;
      default: return <Sales />;
    }
  };

  const NavItem = ({ tab, icon: Icon, label }: { tab: Tab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex flex-col items-center justify-center w-full py-3 transition-colors ${
        activeTab === tab ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      <Icon size={24} strokeWidth={activeTab === tab ? 2.5 : 2} />
      <span className="text-[10px] font-medium mt-1">{label}</span>
    </button>
  );

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-gray-100 font-sans text-gray-900">
      <main className="flex-1 overflow-hidden relative">
        {renderPage()}
      </main>
      
      <nav className="bg-white border-t border-gray-200 flex justify-around items-center z-40 pb-safe">
        <NavItem tab="sales" icon={ShoppingBag} label="Sales" />
        <NavItem tab="inventory" icon={Package} label="Items" />
        <NavItem tab="admin" icon={LayoutDashboard} label="Admin" />
        <NavItem tab="settings" icon={SettingsIcon} label="Settings" />
      </nav>
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}