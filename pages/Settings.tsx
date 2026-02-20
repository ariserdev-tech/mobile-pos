import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Button, Input } from '../components/UI';
import { Store, Printer, Bluetooth, RefreshCw, Info } from 'lucide-react';
import { btPrinter } from '../utils/bluetoothService';

export default function Settings() {
  const { settings, updateSettings } = useStore();
  const [formData, setFormData] = useState(settings);
  const [isBtSupported, setIsBtSupported] = useState<boolean | null>(null);
  const [btStatus, setBtStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setFormData(settings);
    btPrinter.isSupported().then(setIsBtSupported);
  }, [settings]);

  const handleSave = async () => {
    await updateSettings(formData);
    alert('Settings Saved!');
  };

  const handleConnectBt = async () => {
    setBtStatus('connecting');
    setErrorMessage(null);
    try {
      await btPrinter.connect();
      setBtStatus('connected');
    } catch (e: any) {
      setBtStatus('idle');
      if (e.message === 'WEB_BLUETOOTH_UNSUPPORTED') {
        setErrorMessage("Web Bluetooth restricted. Using standard System Print fallback.");
      } else {
        setErrorMessage(e.message);
      }
    }
  };

  return (
    <div className="p-4 pb-24 space-y-6 overflow-y-auto h-full bg-gray-50/50">
      {/* Business Identity Section */}
      <div className="bg-white p-6 rounded-3xl shadow-sm space-y-6 border border-gray-100">
        <div className="flex items-center gap-3 text-gray-900 pb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Store size={20} />
          </div>
          <div>
            <h3 className="font-black text-lg leading-none">Business Identity</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Receipt & Branding Info</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <Input label="Business Name" value={formData.sellerName} onChange={(e) => setFormData({...formData, sellerName: e.target.value})} placeholder="e.g. My Awesome Shop" />
          <Input label="Business Address" value={formData.sellerAddress} onChange={(e) => setFormData({...formData, sellerAddress: e.target.value})} placeholder="123 Street, City" />
          <div className="grid grid-cols-2 gap-4">
             <Input label="Contact Number" value={formData.sellerContact} onChange={(e) => setFormData({...formData, sellerContact: e.target.value})} placeholder="09123456789" />
             <Input label="Website / Social" value={formData.websiteUrl} onChange={(e) => setFormData({...formData, websiteUrl: e.target.value})} placeholder="www.myshop.com" />
          </div>
          <Input label="Return Policy (Footer)" value={formData.returnPolicy} onChange={(e) => setFormData({...formData, returnPolicy: e.target.value})} placeholder="Returns accepted within 7 days..." />
        </div>
      </div>

      {/* Printer Connection Section */}
      <div className="bg-white p-6 rounded-3xl shadow-sm space-y-6 border border-gray-100">
        <div className="flex items-center gap-3 text-gray-900 pb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Printer size={20} />
          </div>
          <div>
            <h3 className="font-black text-lg leading-none">Printer Connection</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Hardware Configuration</p>
          </div>
        </div>

        <div className="space-y-5">
           <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-4 group">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Bluetooth Status</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${btStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                  <p className="font-black text-gray-900">{btStatus === 'connected' ? 'CONNECTED' : 'DISCONNECTED'}</p>
                </div>
              </div>
              {isBtSupported && (
                <button 
                  onClick={handleConnectBt} 
                  disabled={btStatus === 'connecting'}
                  className="w-full bg-gray-900 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-gray-200 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                  {btStatus === 'connecting' ? <RefreshCw className="animate-spin" size={16} /> : <Bluetooth size={16} className="text-primary" />} 
                  {btStatus === 'connected' ? 'Reconnect' : 'Link Device'}
                </button>
              )}
           </div>
           
           {!isBtSupported && (
             <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 flex gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                  <Info size={20} />
                </div>
                <div className="text-xs text-blue-900 space-y-1.5 leading-relaxed">
                  <p className="font-black uppercase tracking-wider">Standard Print Path Active</p>
                  <p className="opacity-80">Direct Web Bluetooth is restricted in this environment. The system will use the <span className="font-bold">Native System Print</span> dialog for all receipts.</p>
                </div>
             </div>
           )}

        </div>
      </div>

      <div className="space-y-4 pt-4">
        <Button onClick={handleSave} className="py-4 text-lg shadow-xl shadow-primary/20">Save All Settings</Button>
        <div className="flex flex-col items-center gap-1">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">MOBILE POS SYSTEM</p>
          <p className="text-gray-300 text-[9px] font-bold uppercase">Version 1.6.0 • Stable</p>
        </div>
      </div>
    </div>
  );
}
