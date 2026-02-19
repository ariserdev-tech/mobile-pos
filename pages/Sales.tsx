import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { InventoryItem, CartItem, CustomerInfo, Transaction } from '../types';
import { Modal, Button, Input } from '../components/UI';
import { Search, ShoppingCart, Plus, Minus, Trash2, Eye, EyeOff, Printer, CheckCircle, FileText, Zap, Bluetooth, RefreshCw, Smartphone } from 'lucide-react';
import { generateReceipt } from '../utils/pdfGenerator';
import { btPrinter } from '../utils/bluetoothService';
import { printDirectThermal } from '../utils/thermalPrinter';

type PaymentType = 'full' | 'partial' | 'loan';

export default function Sales() {
  const { items, addTransaction, settings } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Modals & UI State
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
  const [isConnecting, setIsConnecting] = useState(false);

  // Totals
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
    if (paymentType === 'full') {
      setAmountPaidInput(cartTotal.toFixed(2));
    } else if (paymentType === 'loan') {
      setAmountPaidInput('0.00');
    }
  }, [paymentType, cartTotal, isCartOpen]);

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const lowerQuery = searchQuery.toLowerCase();
    return items.filter(
      (item) => item.name.toLowerCase().includes(lowerQuery) || item.aliases.toLowerCase().includes(lowerQuery)
    );
  }, [items, searchQuery]);

  const addToCart = () => {
    if (!selectedItem) return;
    let finalManualTotal: number | undefined = undefined;
    if (manualTotal !== '') {
        const parsed = parseFloat(manualTotal);
        if (!isNaN(parsed)) finalManualTotal = parsed;
    }
    const newItem: CartItem = { ...selectedItem, quantity: itemQty, manualTotal: finalManualTotal };
    setCart([...cart, newItem]);
    setSelectedItem(null);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentType !== 'full' && !customer.name.trim()) {
      alert("Customer Name is required for balance tracking.");
      return;
    }

    const inputVal = parseFloat(amountPaidInput) || 0;
    let actualPaid = paymentType === 'full' ? cartTotal : (paymentType === 'loan' ? 0 : inputVal);
    let change = (paymentType === 'full' && inputVal > cartTotal) ? inputVal - cartTotal : 0;
    let balance = Math.max(0, cartTotal - actualPaid);

    const timestamp = Date.now();
    const transaction: Transaction = {
      id: timestamp.toString(), 
      timestamp,
      items: cart,
      total: cartTotal,
      amountPaid: actualPaid + change, 
      changeDue: change,
      remainingBalance: balance,
      paymentType,
      customer: customer.name ? customer : undefined,
      isPaid: balance <= 0,
      paymentHistory: actualPaid > 0 ? [{ date: timestamp, amount: actualPaid }] : [],
      sellerInfo: {
        name: settings.sellerName,
        address: settings.sellerAddress,
        contact: settings.sellerContact,
        websiteUrl: settings.websiteUrl,
        returnPolicy: settings.returnPolicy
      }
    };

    await addTransaction(transaction);
    setLastTransaction(transaction);
    setShowReceiptModal(true);
    setCart([]);
    setIsCartOpen(false);
    setCustomer({ name: '', address: '', contact: '' });
    setPaymentType('full');
    setAmountPaidInput('');
  };

  const handleLinkPrinter = async () => {
    setIsConnecting(true);
    try {
      await btPrinter.connect();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handlePrint = async () => {
    if (!lastTransaction) return;
    
    if (btPrinter.isConnected) {
      setIsPrinting(true);
      try {
        await btPrinter.print(lastTransaction);
      } catch (e: any) {
        alert("Bluetooth print failed. Opening fallback...");
        printDirectThermal(lastTransaction);
      } finally {
        setIsPrinting(false);
      }
    } else {
      // Fallback for Shells/Median.co
      printDirectThermal(lastTransaction);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-primary p-3 sticky top-0 z-30 shadow-sm">
        <div className="flex gap-2 items-center relative">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white shadow-sm outline-none text-base"
            />
          </div>
          <button onClick={() => setIsCartOpen(true)} className="relative bg-white h-[42px] px-3 rounded-lg text-primary shadow-sm flex items-center gap-2 min-w-[80px] justify-center border border-white">
            <ShoppingCart size={20} />
            {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border border-white">{cart.length}</span>}
            <span className="font-bold text-sm">{cartTotal.toFixed(2)}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 pb-24 space-y-2">
        {filteredItems.map((item) => (
          <div key={item.id} onClick={() => setSelectedItem(item)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:bg-orange-50 flex justify-between items-center">
            <div><h3 className="font-bold text-gray-800 text-base">{item.name}</h3><p className="text-gray-400 text-xs italic">{item.aliases}</p></div>
            <div className="text-right"><span className="block font-bold text-primary text-xl">{item.sellingPrice.toFixed(2)}</span></div>
          </div>
        ))}
      </div>

      <Modal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title={selectedItem?.name || ''}>
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-100">
            <span className="font-semibold text-gray-600 text-sm">Base Price</span>
            <button onClick={() => setViewBasePrice(!viewBasePrice)} className="px-4 py-2 rounded-lg border bg-gray-100 text-gray-600 font-bold">
              {viewBasePrice ? Number(selectedItem?.basePrice).toFixed(2) : '****'}
            </button>
          </div>
          <div className="flex items-center justify-center gap-6 py-4">
            <button onClick={() => setItemQty(Math.max(1, itemQty - 1))} className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center"><Minus /></button>
            <span className="text-4xl font-bold">{itemQty}</span>
            <button onClick={() => setItemQty(itemQty + 1)} className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center"><Plus /></button>
          </div>
          <Input label="Manual Override Price" type="number" value={manualTotal} onChange={(e) => setManualTotal(e.target.value)} placeholder={(Number(selectedItem?.sellingPrice || 0) * itemQty).toFixed(2)} />
          <Button onClick={addToCart}>Add to Cart</Button>
        </div>
      </Modal>

      <Modal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} title="Shopping Cart">
        <div className="space-y-4">
          <div className="max-h-60 overflow-y-auto space-y-2">
            {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div><div className="font-bold text-sm">{item.name}</div><div className="text-xs text-gray-500">{item.quantity} x {item.sellingPrice.toFixed(2)}</div></div>
                  <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-red-500 p-2"><Trash2 size={18} /></button>
                </div>
            ))}
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-xl font-bold mb-4"><span>Total:</span><span className="text-primary">{cartTotal.toFixed(2)}</span></div>
            <Input placeholder="Customer Name (Required for Loans)" value={customer.name} onChange={(e) => setCustomer({...customer, name: e.target.value})} />
            <div className="bg-gray-50 p-4 rounded-xl space-y-3 mb-4">
               <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setPaymentType('full')} className={`py-2 rounded-lg text-xs font-bold border ${paymentType === 'full' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500 border-gray-200'}`}>Full</button>
                  <button onClick={() => setPaymentType('partial')} className={`py-2 rounded-lg text-xs font-bold border ${paymentType === 'partial' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500 border-gray-200'}`}>Partial</button>
                  <button onClick={() => setPaymentType('loan')} className={`py-2 rounded-lg text-xs font-bold border ${paymentType === 'loan' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500 border-gray-200'}`}>Loan</button>
               </div>
               {(paymentType === 'full' || paymentType === 'partial') && (
                 <Input label="Cash Received" type="number" value={amountPaidInput} onChange={(e) => setAmountPaidInput(e.target.value)} />
               )}
               {paymentType === 'partial' && <div className="text-red-600 font-bold text-sm">Balance: {remainingBalance.toFixed(2)}</div>}
            </div>
            <Button onClick={handleCheckout} disabled={cart.length === 0}>Complete Sale</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showReceiptModal} onClose={() => setShowReceiptModal(false)} title="Sale Completed">
        <div className="text-center space-y-4">
           <CheckCircle size={60} className="mx-auto text-green-500" />
           <p className="text-2xl font-bold">Total: {lastTransaction?.total.toFixed(2)}</p>
           
           <div className="grid grid-cols-1 gap-3">
             <Button onClick={handlePrint} disabled={isPrinting} className="bg-primary text-white flex items-center justify-center gap-2">
                {isPrinting ? <RefreshCw className="animate-spin" size={18} /> : (btPrinter.isConnected ? <Printer size={18} /> : <Zap size={18} />)} 
                {btPrinter.isConnected ? 'Print via Bluetooth' : 'Print via Direct Thermal'}
             </Button>

             {!btPrinter.isConnected && (
               <Button variant="secondary" onClick={handleLinkPrinter} disabled={isConnecting} className="text-xs font-bold border-dashed text-primary border-primary">
                 {isConnecting ? <RefreshCw className="animate-spin" size={14} /> : <Bluetooth size={14} />} 
                 Request Bluetooth Permission & Link Hardware
               </Button>
             )}

             <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => generateReceipt(lastTransaction!)} className="text-sm"><FileText size={16} /> PDF</Button>
                <Button variant="secondary" onClick={() => setShowReceiptModal(false)} className="text-sm">New Sale</Button>
             </div>
           </div>
        </div>
      </Modal>

      {/* Hidden browser print area */}
      <div className="hidden print:block">
          {lastTransaction && (
            <div className="w-[58mm] text-[8.5pt] p-2 leading-tight">
                <div className="text-center font-bold mb-1">{lastTransaction.sellerInfo.name.toUpperCase()}</div>
                <div className="text-center text-[7pt] mb-2">{lastTransaction.sellerInfo.address}</div>
                <div className="border-t border-black my-1"></div>
                {lastTransaction.items.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{item.name} x{item.quantity}</span>
                    <span>{(item.manualTotal ?? item.sellingPrice * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-black my-1"></div>
                <div className="flex justify-between font-bold"><span>TOTAL</span><span>{lastTransaction.total.toFixed(2)}</span></div>
                <div className="text-center mt-4">Thank you!</div>
            </div>
          )}
      </div>
    </div>
  );
}