import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Button, Input, Modal } from '../components/UI';
import { Store, Printer, Bluetooth, RefreshCw, AlertCircle, Info, Eye, Search, ShieldCheck } from 'lucide-react';
import { btPrinter } from '../utils/bluetoothService';
import { generateReceipt } from '../utils/pdfGenerator';
import { Transaction } from '../types';

export default function Settings() {
  const { settings, updateSettings } = useStore();
  const [formData, setFormData] = useState(settings);
  const [isBtSupported, setIsBtSupported] = useState<boolean | null>(null);
  const [btStatus, setBtStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [connectedName, setConnectedName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setFormData(settings);
    btPrinter.isSupported().then(setIsBtSupported);
    if (btPrinter.isConnected) {
        setBtStatus('connected');
        setConnectedName(btPrinter.deviceName);
    }
  }, [settings]);

  const handleSave = async () => {
    await updateSettings(formData);
    alert('Settings Saved!');
  };

  const handleConnectBt = async () => {
    setBtStatus('connecting');
    setErrorMessage(null);
    try {
      // Trigger the standard Web Bluetooth device selection dialog
      const name = await btPrinter.connect();
      setConnectedName(name);
      setBtStatus('connected');
    } catch (e: any) {
      setBtStatus('idle');
      setErrorMessage(e.message);
    }
  };

  const previewReceipt = () => {
    const mockTx: Transaction = {
      id: "MOCK-12345",
      timestamp: Date.now(),
      total: 450.00,
      amountPaid: 450.00,
      changeDue: 0.00,
      remainingBalance: 0,
      paymentType: "full",
      paymentHistory: [],
      isPaid: true,
      items: [
        { id: "1", name: "Sample Product Item", aliases: "", basePrice: 50, sellingPrice: 150, quantity: 2 },
        { id: "2", name: "Standard Product Item", aliases: "", basePrice: 100, sellingPrice: 150, quantity: 1 }
      ],
      sellerInfo: {
        name: formData.sellerName || "Your Business Name",
        address: formData.sellerAddress || "123 Business St, City",
        contact: formData.sellerContact || "09123456789",
        websiteUrl: formData.websiteUrl || "www.yourwebsite.com",
        returnPolicy: formData.returnPolicy || "Returns accepted within 30 days."
      }
    };
    generateReceipt(mockTx);
  };

  return (
    <div className="p-5 pb-24 space-y-6 overflow-y-auto h-full text-gray-900 bg-gray-50">
      <h2 className="text-xl font-bold text-gray-800 px-1">Settings & Printer</h2>
      
      {/* Store Identity Section */}
      <div className="bg-white p-5 rounded-xl shadow-sm space-y-4 border border-gray-100">
        <div className="flex items-center gap-2 mb-2 text-primary border-b border-gray-50 pb-3">
          <Store size={18} />
          <h3 className="font-bold uppercase text-[10px] tracking-widest">Business Identity</h3>
        </div>
        
        <div className="space-y-4">
          <Input label="Business Name" value={formData.sellerName} onChange={(e) => setFormData({...formData, sellerName: e.target.value})} placeholder="e.g. Acme Retail" />
          <Input label="Address on Receipt" value={formData.sellerAddress} onChange={(e) => setFormData({...formData, sellerAddress: e.target.value})} placeholder="e.g. 123 Store Blvd" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Input label="Contact Number" value={formData.sellerContact} onChange={(e) => setFormData({...formData, sellerContact: e.target.value})} placeholder="e.g. 0912 345 6789" />
             <Input label="Website URL" value={formData.websiteUrl} onChange={(e) => setFormData({...formData, websiteUrl: e.target.value})} placeholder="e.g. www.acme.shop" />
          </div>
        </div>
        
        <div className="pt-2">
          <Input label="Return Policy" value={formData.returnPolicy} onChange={(e) => setFormData({...formData, returnPolicy: e.target.value})} placeholder="e.g. Returns accepted within 30 days." />
        </div>
      </div>

      {/* Hardware / Bluetooth Section */}
      <div className="bg-white p-5 rounded-xl shadow-sm space-y-4 border border-gray-100">
        <div className="flex items-center gap-2 text-primary border-b border-gray-50 pb-3">
          <Printer size={18} />
          <h3 className="font-bold uppercase text-[10px] tracking-widest">Printer Connection</h3>
        </div>

        <div className="space-y-4">
          {isBtSupported !== false ? (
            <div className="space-y-3">
               <div className={`p-4 rounded-xl border transition-all ${btStatus === 'connected' ? 'border-green-100 bg-green-50/50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Device Status</p>
                        <p className={`font-bold text-base ${btStatus === 'connected' ? 'text-green-600' : 'text-gray-600'}`}>
                            {btStatus === 'connected' ? `Linked: ${connectedName}` : btStatus === 'connecting' ? 'Discovering...' : 'Disconnected'}
                        </p>
                    </div>
                    {btStatus === 'connected' && <ShieldCheck className="text-green-500" size={20} />}
                  </div>
                  
                  <Button 
                    onClick={handleConnectBt} 
                    disabled={btStatus === 'connecting'} 
                    className={`py-3.5 text-sm font-bold shadow-sm ${btStatus === 'connected' ? 'bg-white text-green-600 border border-green-200' : 'bg-primary text-white'}`}
                  >
                    {btStatus === 'connecting' ? (
                      <RefreshCw className="animate-spin" size={18} />
                    ) : (
                      <Bluetooth size={18} />
                    )}
                    {btStatus === 'connected' ? 'Change Linked Printer' : 'Scan for Nearby Printers'}
                  </Button>
               </div>
               
               {errorMessage && (
                 <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-start gap-3">
                    <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="text-xs text-red-800 font-bold uppercase tracking-tight mb-1">Permission Required</p>
                      <p className="text-xs text-red-700 leading-relaxed">{errorMessage}</p>
                    </div>
                 </div>
               )}
            </div>
          ) : (
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-start gap-3">
               <Info className="text-orange-500 shrink-0 mt-0.5" size={20} />
               <div>
                 <p className="text-xs text-orange-800 font-bold uppercase tracking-tight mb-1">Web Bluetooth Restricted</p>
                 <p className="text-xs text-orange-700 leading-relaxed">
                   Your browser doesn't support direct Bluetooth. Please use <b>RawBT</b> app (Android) or <b>System Print</b> for your hardware.
                 </p>
               </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button variant="secondary" onClick={previewReceipt} className="py-3 text-xs font-bold uppercase border-gray-200 bg-white text-gray-600">
              <Eye size={14} /> Digital Preview
            </Button>
            <Button variant="secondary" onClick={() => window.print()} className="py-3 text-xs font-bold uppercase border-gray-200 bg-white text-gray-600">
              <Printer size={14} /> System Test
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <Button onClick={handleSave} className="shadow-lg shadow-orange-100 py-4 text-lg">Save Settings</Button>
        <div className="text-center py-4 space-y-1">
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">SALES POS v1.4.4</p>
          <p className="text-gray-300 text-[9px] font-medium italic">Support: ariserdev@gmail.com</p>
        </div>
      </div>
    </div>
  );
}