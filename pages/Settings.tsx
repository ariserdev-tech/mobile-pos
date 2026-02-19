import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Button, Input } from '../components/UI';
import { Store, Printer, Bluetooth, RefreshCw, Info, Smartphone } from 'lucide-react';
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
    <div className="p-5 pb-24 space-y-6 overflow-y-auto h-full bg-gray-50">
      <div className="bg-white p-5 rounded-xl shadow-sm space-y-4 border">
        <div className="flex items-center gap-2 text-primary border-b pb-3 font-bold uppercase text-xs">
          <Store size={18} /> Business Identity
        </div>
        <div className="space-y-4">
          <Input label="Business Name" value={formData.sellerName} onChange={(e) => setFormData({...formData, sellerName: e.target.value})} />
          <Input label="Address" value={formData.sellerAddress} onChange={(e) => setFormData({...formData, sellerAddress: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
             <Input label="Contact" value={formData.sellerContact} onChange={(e) => setFormData({...formData, sellerContact: e.target.value})} />
             <Input label="Website" value={formData.websiteUrl} onChange={(e) => setFormData({...formData, websiteUrl: e.target.value})} />
          </div>
          <Input label="Return Policy" value={formData.returnPolicy} onChange={(e) => setFormData({...formData, returnPolicy: e.target.value})} />
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm space-y-4 border">
        <div className="flex items-center gap-2 text-primary border-b pb-3 font-bold uppercase text-xs">
          <Printer size={18} /> Printer Connection
        </div>

        <div className="space-y-3">
           <div className="p-4 rounded-xl border bg-gray-50 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Bluetooth Status</p>
                <p className="font-bold">{btStatus === 'connected' ? 'Connected' : 'Disconnected'}</p>
              </div>
              {isBtSupported && (
                <Button onClick={handleConnectBt} className="w-auto px-6 py-2 text-sm">
                  {btStatus === 'connecting' ? <RefreshCw className="animate-spin" /> : <Bluetooth size={16} />} 
                  Link Device
                </Button>
              )}
           </div>
           
           {!isBtSupported && (
             <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                <Info className="text-blue-500 shrink-0" size={20} />
                <div className="text-xs text-blue-800 space-y-2 leading-relaxed">
                  <p className="font-bold uppercase">Standard Print Path Active</p>
                  <p>Direct Web Bluetooth is not available in this shell. The system will use the <b>Native System Print</b> dialog.</p>
                </div>
             </div>
           )}

           <div className="border-t pt-4 space-y-3">
              <h4 className="font-bold text-gray-700 text-sm flex items-center gap-2"><Smartphone size={16} /> Thermal Print Calibration</h4>
              <ul className="text-xs text-gray-500 space-y-2 list-disc pl-4">
                <li>Set <b>Margins</b> to 'None' in the print dialog.</li>
                <li>Set <b>Scale</b> to 'Default' or 'Fit to Width'.</li>
                <li>Ensure <b>Paper Size</b> is set to 58mm or 80mm.</li>
              </ul>
           </div>
        </div>

        <Button variant="secondary" onClick={() => window.print()} className="py-2 text-xs font-bold uppercase"><Printer size={14} /> Test System Print</Button>
      </div>

      <div className="space-y-4">
        <Button onClick={handleSave} className="py-4 text-lg">Save All Settings</Button>
        <p className="text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest">SALES POS v1.6.0</p>
      </div>
    </div>
  );
}