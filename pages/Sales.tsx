import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { InventoryItem, CartItem, CustomerInfo, Transaction } from '../types';
import { Modal, Button, Input } from '../components/UI';
import { Search, ShoppingCart, Plus, Minus, Trash2, Printer, CheckCircle, FileText, Bluetooth, RefreshCw } from 'lucide-react';
import { generateReceipt } from '../utils/pdfGenerator';
import { btPrinter } from '../utils/bluetoothService';
import { printDirectThermal } from '../utils/thermalPrinter';

type PaymentType = 'full' | 'partial' | 'loan';

export default function Sales() {
  const { items, addTransaction, settings } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [itemQty, setItemQty] = useState(1);
  const [viewBasePrice, setViewBasePrice] = useState(false); 
  const [manualTotal, setManualTotal] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customer, setCustomer] = useState<CustomerInfo>({ name: '', address: '', contact: '' });
  const [paymentType, setPaymentType] = useState<PaymentType>('full');
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isBtSupported, setIsBtSupported] = useState(false);

  useEffect(() => {
    btPrinter.isSupported().then(setIsBtSupported);
  }, []);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      if (item.manualTotal !== undefined && item.manualTotal !== null) return sum + Number(item.manualTotal);
      return sum + (Number(item.sellingPrice) * item.quantity);
    }, 0);
  }, [cart]);

  const remainingBalance = useMemo(() => {
    const paid = parseFloat(amountPaidInput) || 0;
    return Math.max(0, cartTotal - paid);
  }, [cartTotal, amountPaidInput]);

  useEffect(() => {
    if (paymentType === 'full') setAmountPaidInput(cartTotal.toFixed(2));
    else if (paymentType === 'loan') setAmountPaidInput('0.00');
  }, [paymentType, cartTotal, isCartOpen]);

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const lowerQuery = searchQuery.toLowerCase();
    return items.filter(i => i.name.toLowerCase().includes(lowerQuery) || i.aliases.toLowerCase().includes(lowerQuery));
  }, [items, searchQuery]);

  const addToCart = () => {
    if (!selectedItem) return;
    let finalManualTotal: number | undefined = undefined;
    if (manualTotal !== '') {
        const parsed = parseFloat(manualTotal);
        if (!isNaN(parsed)) finalManualTotal = parsed;
    }
    setCart([...cart, { ...selectedItem, quantity: itemQty, manualTotal: finalManualTotal }]);
    setSelectedItem(null);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentType !== 'full' && !customer.name.trim()) return alert("Customer Name required for loans.");

    const tx: Transaction = {
      id: Date.now().toString(), 
      timestamp: Date.now(),
      items: cart,
      total: cartTotal,
      amountPaid: (parseFloat(amountPaidInput) || 0), 
      changeDue: paymentType === 'full' ? Math.max(0, (parseFloat(amountPaidInput) || 0) - cartTotal) : 0,
      remainingBalance: remainingBalance,
      paymentType,
      customer: customer.name ? customer : undefined,
      isPaid: remainingBalance <= 0,
      paymentHistory: [],
      sellerInfo: { ...settings }
    };

    await addTransaction(tx);
    setLastTransaction(tx);
    setShowReceiptModal(true);
    setCart([]);
    setIsCartOpen(false);
  };

  const handleSmartPrint = async () => {
    if (!lastTransaction) return;
    setIsPrinting(true);
    try {
      if (btPrinter.isConnected) {
        await btPrinter.print(lastTransaction);
      } else {
        printDirectThermal(lastTransaction);
      }
    } catch (e) {
      printDirectThermal(lastTransaction);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-primary p-3 sticky top-0 z-30 shadow-sm flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Search items..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 rounded-lg outline-none text-base" />
        </div>
        <button onClick={() => setIsCartOpen(true)} className="relative bg-white h-[42px] px-3 rounded-lg text-primary shadow-sm flex items-center gap-2 font-bold border border-white">
          <ShoppingCart size={20} />
          <span className="text-sm">{cartTotal.toFixed(0)}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 pb-24 space-y-2">
        {filteredItems.map((item) => (
          <div key={item.id} onClick={() => {setSelectedItem(item); setItemQty(1); setManualTotal('');}} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:bg-orange-50 flex justify-between items-center">
            <div><h3 className="font-bold text-gray-800">{item.name}</h3><p className="text-gray-400 text-xs italic">{item.aliases}</p></div>
            <div className="text-right font-bold text-primary text-xl">{item.sellingPrice.toFixed(2)}</div>
          </div>
        ))}
      </div>

      <Modal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title={selectedItem?.name || ''}>
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border">
            <span className="font-semibold text-gray-600 text-sm">Base Price</span>
            <button onClick={() => setViewBasePrice(!viewBasePrice)} className="px-4 py-1.5 rounded-lg border bg-gray-100 text-gray-600 font-bold">{viewBasePrice ? Number(selectedItem?.basePrice).toFixed(2) : '****'}</button>
          </div>
          <div className="flex items-center justify-center gap-6 py-4">
            <button onClick={() => setItemQty(Math.max(1, itemQty - 1))} className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center"><Minus /></button>
            <span className="text-4xl font-bold">{itemQty}</span>
            <button onClick={() => setItemQty(itemQty + 1)} className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center"><Plus /></button>
          </div>
          <Input label="Override Price (Optional)" type="number" value={manualTotal} onChange={(e) => setManualTotal(e.target.value)} placeholder={(Number(selectedItem?.sellingPrice || 0) * itemQty).toFixed(2)} />
          <Button onClick={addToCart}>Add to Cart</Button>
        </div>
      </Modal>

      <Modal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} title="Shopping Cart">
        <div className="space-y-4">
          <div className="max-h-60 overflow-y-auto space-y-2">
            {cart.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
                <div><div className="font-bold text-sm">{item.name}</div><div className="text-xs text-gray-500">{item.quantity} x {item.sellingPrice.toFixed(2)}</div></div>
                <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-red-500 p-2"><Trash2 size={18} /></button>
              </div>
            ))}
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between text-xl font-bold mb-4"><span>Total:</span><span className="text-primary">{cartTotal.toFixed(2)}</span></div>
            <Input placeholder="Customer Name" value={customer.name} onChange={(e) => setCustomer({...customer, name: e.target.value})} />
            <div className="bg-gray-50 p-3 rounded-xl space-y-3 mb-4">
               <div className="grid grid-cols-3 gap-2">
                  {['full', 'partial', 'loan'].map(type => (
                    <button key={type} onClick={() => setPaymentType(type as PaymentType)} className={`py-2 rounded-lg text-xs font-bold border capitalize ${paymentType === type ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500 border-gray-200'}`}>{type}</button>
                  ))}
               </div>
               {(paymentType !== 'loan') && <Input label="Cash Received" type="number" value={amountPaidInput} onChange={(e) => setAmountPaidInput(e.target.value)} />}
            </div>
            <Button onClick={handleCheckout} disabled={cart.length === 0}>Complete Sale</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showReceiptModal} onClose={() => setShowReceiptModal(false)} title="Sale Success">
        <div className="text-center space-y-4">
           <CheckCircle size={60} className="mx-auto text-green-500" />
           <p className="text-2xl font-bold text-gray-800">TOTAL: {lastTransaction?.total.toFixed(2)}</p>
           
           <div className="grid grid-cols-1 gap-3">
             <Button onClick={handleSmartPrint} disabled={isPrinting} className="bg-primary text-white py-4 shadow-lg shadow-orange-100 flex items-center justify-center gap-3">
                {isPrinting ? <RefreshCw className="animate-spin" size={20} /> : <Printer size={20} />} 
                <div className="text-left">
                  <div className="font-bold">{btPrinter.isConnected ? 'Bluetooth Print' : 'Standard Thermal Print'}</div>
                  <div className="text-[10px] opacity-80 font-normal">{btPrinter.isConnected ? 'Direct Link' : 'System Dialog'}</div>
                </div>
             </Button>

             <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => generateReceipt(lastTransaction!)} className="text-sm"><FileText size={16} /> PDF Receipt</Button>
                <Button variant="secondary" onClick={() => setShowReceiptModal(false)} className="text-sm">Done</Button>
             </div>
           </div>
        </div>
      </Modal>

      {/* Hidden browser print area for 58mm thermal */}
      <div className="hidden print:block print-container">
          {lastTransaction && (
            <div className="w-[58mm] text-[8.5pt] leading-tight bg-white text-black font-mono">
                <div className="text-center font-bold mb-1">{lastTransaction.sellerInfo.name.toUpperCase()}</div>
                <div className="text-center text-[7.5pt] mb-1">{lastTransaction.sellerInfo.address}</div>
                {lastTransaction.sellerInfo.contact && <div className="text-center text-[7.5pt] mb-1">Tel: {lastTransaction.sellerInfo.contact}</div>}
                
                <div className="border-t border-black my-2"></div>
                
                <div className="flex justify-between text-[7pt]"><span>No: {lastTransaction.id.slice(-8).toUpperCase()}</span><span>{new Date(lastTransaction.timestamp).toLocaleDateString()}</span></div>
                <div className="text-[7pt] mb-2 uppercase">Pay: {lastTransaction.paymentType}</div>
                
                <div className="border-t border-black my-2"></div>
                
                <div className="space-y-3">
                  {lastTransaction.items.map((item, i) => {
                    const subtotal = (item.manualTotal ?? item.sellingPrice * item.quantity).toFixed(2);
                    return (
                      <div key={i} className="flex flex-col">
                        <span className="font-bold">{item.name}</span>
                        <div className="flex justify-between pl-2 italic">
                          <span>{item.quantity} x {item.sellingPrice.toFixed(2)}</span>
                          <span>{subtotal}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-black my-3"></div>
                
                <div className="flex justify-between font-bold text-[9pt]"><span>TOTAL DUE</span><span>{lastTransaction.total.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>PAID</span><span>{lastTransaction.amountPaid.toFixed(2)}</span></div>
                {lastTransaction.remainingBalance > 0 && <div className="flex justify-between font-bold"><span>BALANCE</span><span>{lastTransaction.remainingBalance.toFixed(2)}</span></div>}
                
                <div className="text-center mt-8 pt-4 border-t border-dashed border-gray-300">Thank you for shopping!</div>
                {lastTransaction.sellerInfo.returnPolicy && <div className="text-[6pt] text-center mt-2 italic opacity-60">{lastTransaction.sellerInfo.returnPolicy}</div>}
                <div className="h-10"></div>
            </div>
          )}
      </div>
    </div>
  );
}