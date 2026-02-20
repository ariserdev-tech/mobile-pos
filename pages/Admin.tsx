import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Transaction } from '../types';
import { Modal, Button, Input } from '../components/UI';
import { generateReceipt } from '../utils/pdfGenerator';
import { btPrinter } from '../utils/bluetoothService';
import { ChevronLeft, ChevronRight, FileText, Users, Eye, Package, Search, Wallet, History, Calendar, Download, Bluetooth, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Admin() {
  const { transactions, updateTransaction } = useStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // States
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [showLoanManager, setShowLoanManager] = useState(false);
  const [loanTab, setLoanTab] = useState<'today' | 'all'>('today');
  const [repaymentTx, setRepaymentTx] = useState<Transaction | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);

  // Helpers
  const getStartOfDay = (d: Date) => {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    return date;
  };
  const currentViewDate = getStartOfDay(selectedDate);
  const todayDate = getStartOfDay(new Date());
  const endOfDay = new Date(currentViewDate);
  endOfDay.setHours(23, 59, 59, 999);

  const isSameDay = (timestamp: number) => {
      const t = new Date(timestamp);
      return t.getFullYear() === currentViewDate.getFullYear() &&
             t.getMonth() === currentViewDate.getMonth() &&
             t.getDate() === currentViewDate.getDate();
  };

  const dailyTransactions = useMemo(() => {
    return transactions.filter(t => t.timestamp >= currentViewDate.getTime() && t.timestamp <= endOfDay.getTime());
  }, [transactions, currentViewDate]);

  const allOutstandingLoans = useMemo(() => {
    return transactions.filter(t => t.remainingBalance > 0).sort((a, b) => (a.customer?.name || '').localeCompare(b.customer?.name || '') || b.timestamp - a.timestamp);
  }, [transactions]);

  const dailyLoans = useMemo(() => dailyTransactions.filter(t => t.remainingBalance > 0), [dailyTransactions]);

  const stats = useMemo(() => {
    const revenueStats = dailyTransactions.reduce((acc, t) => {
        const cogs = t.items.reduce((sum, item) => sum + ((item.basePrice || 0) * item.quantity), 0);
        const profit = t.isPaid ? (t.total - cogs) : 0;
        return { totalSales: acc.totalSales + t.total, netSales: acc.netSales + profit };
    }, { totalSales: 0, netSales: 0 });

    const cashCollected = transactions.reduce((total, t) => {
        const history = t.paymentHistory || [];
        if (history.length === 0) return isSameDay(t.timestamp) ? total + t.amountPaid : total;
        return total + history.filter(p => isSameDay(p.date)).reduce((sum, p) => sum + p.amount, 0);
    }, 0);

    return { ...revenueStats, cashCollected };
  }, [dailyTransactions, transactions, currentViewDate]);

  const dailyLoanTotal = useMemo(() => dailyLoans.reduce((sum, t) => sum + t.remainingBalance, 0), [dailyLoans]);
  const totalAccumulatedLoans = useMemo(() => allOutstandingLoans.reduce((sum, t) => sum + t.remainingBalance, 0), [allOutstandingLoans]);

  const aggregatedItems = useMemo(() => {
    const itemMap = new Map<string, { name: string; quantity: number; total: number }>();
    dailyTransactions.forEach(tx => {
      tx.items.forEach(item => {
        const existing = itemMap.get(item.id);
        const itemTotal = item.manualTotal ?? (item.sellingPrice * item.quantity);
        if (existing) { existing.quantity += item.quantity; existing.total += itemTotal; }
        else { itemMap.set(item.id, { name: item.name, quantity: item.quantity, total: itemTotal }); }
      });
    });
    return Array.from(itemMap.values());
  }, [dailyTransactions]);

  const filteredAggregatedItems = useMemo(() => {
    if (!itemSearchQuery) return aggregatedItems;
    const lower = itemSearchQuery.toLowerCase();
    return aggregatedItems.filter(i => i.name.toLowerCase().includes(lower));
  }, [aggregatedItems, itemSearchQuery]);

  const handleRepaymentSubmit = async () => {
    if (!repaymentTx) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0 || amount > repaymentTx.remainingBalance + 0.1) return alert("Invalid amount");

    const updatedTx: Transaction = {
        ...repaymentTx,
        amountPaid: repaymentTx.amountPaid + amount,
        remainingBalance: Math.max(0, repaymentTx.total - (repaymentTx.amountPaid + amount)),
        isPaid: (repaymentTx.total - (repaymentTx.amountPaid + amount)) <= 0.01,
        paymentHistory: [...(repaymentTx.paymentHistory || []), { date: Date.now(), amount }]
    };
    await updateTransaction(updatedTx);
    setRepaymentTx(null);
  };

  const handleBtPrint = async (tx: Transaction) => {
    if (!btPrinter.isConnected) {
        alert("Printer not connected. Connect in Settings.");
        return;
    }
    setIsPrinting(true);
    try {
        await btPrinter.print(tx);
    } catch (e) {
        alert("Print failed: " + (e as Error).message);
    } finally {
        setIsPrinting(false);
    }
  };

  const downloadItemsSoldPDF = () => {
    const doc = new jsPDF();
    doc.text(`Items Sold - ${selectedDate.toLocaleDateString()}`, 14, 15);
    autoTable(doc, {
        startY: 20,
        head: [['Item Name', 'Qty', 'Revenue']],
        body: filteredAggregatedItems.map(i => [i.name, i.quantity, i.total.toFixed(2)]),
        theme: 'striped', headStyles: { fillColor: [238, 77, 45] }
    });
    doc.save(`items_${selectedDate.toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="p-4 pb-24 space-y-6 h-full overflow-y-auto bg-gray-50/50">
      {/* Date Selector */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm border border-gray-50">
        <button 
          onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)))} 
          className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-full text-gray-600 active:scale-90 transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center cursor-pointer" onClick={() => setSelectedDate(new Date())}>
           <h2 className="font-black text-gray-900 text-lg">
             {selectedDate.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
           </h2>
        </div>
        <button 
          onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)))} 
          disabled={getStartOfDay(selectedDate).getTime() >= todayDate.getTime()} 
          className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-full text-gray-600 active:scale-90 transition-all disabled:opacity-20"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#00B14F] p-5 rounded-2xl shadow-sm col-span-2 relative overflow-hidden group">
            <p className="text-[11px] font-medium text-white/80 mb-1">Cash Collected Today</p>
            <p className="text-4xl font-black text-white tracking-tighter">
              {stats.cashCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
          <p className="text-[11px] font-medium text-gray-400 mb-1">Sales</p>
          <p className="text-2xl font-black text-gray-900 leading-none">{stats.totalSales.toFixed(2)}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
          <p className="text-[11px] font-medium text-gray-400 mb-1">Profit (Paid)</p>
          <p className="text-2xl font-black text-[#00B14F] leading-none">{stats.netSales.toFixed(2)}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50 col-span-2 flex justify-between items-center gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-gray-400 mb-1">Loans Due</p>
              <p className="text-2xl font-black text-[#EE4D2D] truncate">{dailyLoanTotal.toFixed(2)}</p>
            </div>
            <button 
              onClick={() => setShowLoanManager(true)} 
              className="bg-[#FFF5F1] text-[#EE4D2D] px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 active:scale-95 transition-all shrink-0"
            >
              <Wallet size={16} /> Manage
            </button>
        </div>

        <button 
          onClick={() => setShowItemsModal(true)} 
          className="col-span-2 bg-white text-[#EE4D2D] p-4 rounded-2xl shadow-sm border border-[#FFF5F1] flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest active:scale-[0.98] transition-all"
        >
          <Package size={20} className="text-[#EE4D2D]" /> 
          <span>View Items Sold</span>
        </button>
      </div>

      {/* Transaction List */}
      <div className="space-y-4">
        <div className="px-1">
          <h3 className="text-lg font-black text-[#263238]">
            Daily Transactions
          </h3>
        </div>
        
        <div className="space-y-3">
          {dailyTransactions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
              <Calendar size={40} className="mx-auto text-gray-200 mb-2" />
              <p className="text-gray-400 text-sm font-medium">No transactions for this day</p>
            </div>
          ) : (
            dailyTransactions.map(tx => (
              <div 
                key={tx.id} 
                onClick={() => setSelectedTx(tx)} 
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer hover:border-primary/30 transition-colors active:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                    <Users size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{tx.customer?.name || 'Walk-in Customer'}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                      {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {tx.paymentType}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-gray-900">₱{tx.total.toFixed(2)}</p>
                  {tx.remainingBalance > 0 && (
                    <span className="text-[9px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-black border border-red-100">
                      BAL: {tx.remainingBalance.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={showLoanManager} onClose={() => setShowLoanManager(false)} title="Loan Management">
         <div className="flex flex-col h-[60vh] overflow-hidden">
             <div className="flex p-1 bg-gray-100 rounded-xl mb-4"><button onClick={() => setLoanTab('today')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${loanTab === 'today' ? 'bg-white text-primary' : 'text-gray-500'}`}>Today</button><button onClick={() => setLoanTab('all')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${loanTab === 'all' ? 'bg-white text-primary' : 'text-gray-500'}`}>All Time</button></div>
             <div className="flex-1 overflow-y-auto space-y-3 pb-4">
                 {(loanTab === 'today' ? dailyLoans : allOutstandingLoans).map(tx => (
                     <div key={tx.id} className="bg-white p-4 rounded-xl flex flex-col gap-2 shadow-sm">
                         <div className="flex justify-between items-start">
                             <div><span className="font-bold text-lg">{tx.customer?.name}</span><p className="text-xs text-gray-500">{new Date(tx.timestamp).toLocaleDateString()}</p></div>
                             <div className="text-right text-red-500 font-bold">{tx.remainingBalance.toFixed(2)}</div>
                         </div>
                         <div className="flex gap-2"><button onClick={() => setSelectedTx(tx)} className="flex-1 bg-gray-100 p-2 rounded text-sm font-bold flex items-center justify-center gap-1"><Eye size={14}/> Items</button><button onClick={() => {setRepaymentTx(tx); setPaymentAmount('');}} className="flex-1 bg-primary text-white p-2 rounded text-sm font-bold shadow-md">Pay</button></div>
                     </div>
                 ))}
             </div>
         </div>
      </Modal>

      <Modal isOpen={showItemsModal} onClose={() => setShowItemsModal(false)} title="Items Sold">
        <div className="space-y-4">
          <div className="flex gap-2"><input type="text" placeholder="Search..." value={itemSearchQuery} onChange={e => setItemSearchQuery(e.target.value)} className="flex-1 p-3 rounded-xl bg-gray-50 outline-none"/><button onClick={downloadItemsSoldPDF} className="bg-primary/10 text-primary p-3 rounded-xl"><Download/></button></div>
          <div className="max-h-[50vh] overflow-y-auto space-y-2">
             {filteredAggregatedItems.map((item, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-xl flex justify-between items-center"><div><p className="font-bold">{item.name}</p><p className="text-xs text-gray-500">{item.total.toFixed(2)}</p></div><div className="bg-white px-3 py-1 rounded font-bold text-primary">{item.quantity} sold</div></div>
             ))}
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!selectedTx} onClose={() => setSelectedTx(null)} title="Transaction">
        {selectedTx && <div className="space-y-4">
             <div className="bg-gray-50 p-3 rounded text-sm space-y-1"><p>ID: {selectedTx.id}</p><p>Customer: {selectedTx.customer?.name || 'Walk-in'}</p></div>
             <div className="py-2 space-y-1">{selectedTx.items.map((i, idx) => <div key={idx} className="flex justify-between text-sm"><span>{i.quantity}x {i.name}</span><span>{(i.manualTotal ?? i.sellingPrice * i.quantity).toFixed(2)}</span></div>)}</div>
             <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{selectedTx.total.toFixed(2)}</span></div>
             <div className="flex justify-between text-red-500 font-bold"><span>Balance</span><span>{selectedTx.remainingBalance.toFixed(2)}</span></div>
             <div className="grid grid-cols-2 gap-3 pt-4">
                <Button 
                    onClick={() => handleBtPrint(selectedTx)} 
                    disabled={isPrinting}
                    className={`flex items-center justify-center gap-2 border-none ${btPrinter.isConnected ? 'bg-primary' : 'bg-gray-400'}`}
                >
                    {isPrinting ? <RefreshCw className="animate-spin" size={18}/> : <Bluetooth size={18}/>} Direct Print
                </Button>
                <Button variant="secondary" onClick={() => generateReceipt(selectedTx)} className="flex items-center justify-center gap-2"><FileText size={18}/> PDF</Button>
             </div>
        </div>}
      </Modal>

      <Modal isOpen={!!repaymentTx} onClose={() => setRepaymentTx(null)} title="Loan Repayment">
          {repaymentTx && <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-xl text-center"><p className="text-gray-500">Customer: <span className="font-bold text-gray-800">{repaymentTx.customer?.name}</span></p><p className="text-xl font-bold text-red-500 mt-2">Balance: {repaymentTx.remainingBalance.toFixed(2)}</p></div>
              <Input label="Amount to Pay" type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="0.00" className="text-3xl font-bold text-primary" />
              <div className="flex gap-3 pt-4"><Button variant="secondary" onClick={() => setRepaymentTx(null)}>Cancel</Button><Button onClick={handleRepaymentSubmit}>Confirm</Button></div>
          </div>}
      </Modal>
    </div>
  );
}