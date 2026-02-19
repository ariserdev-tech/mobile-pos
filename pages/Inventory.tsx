import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { InventoryItem } from '../types';
import { Modal, Button, Input } from '../components/UI';
import { Search, Edit2, Trash2, Plus, Download, Upload, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { v4 as uuidv4 } from 'uuid';

export default function Inventory() {
  const { items, addItem, updateItem, deleteItem, importInventory } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [editItem, setEditItem] = useState<Partial<InventoryItem> | null>(null);
  
  // Delete Modal State
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // JSON Import State
  const [importMode, setImportMode] = useState(false);
  const [replaceInventory, setReplaceInventory] = useState(false);

  // PDF Export State
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfOptions, setPdfOptions] = useState({ showBase: true, showSelling: true });

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const lower = searchQuery.toLowerCase();
    return items.filter(i => i.name.toLowerCase().includes(lower) || i.aliases.toLowerCase().includes(lower));
  }, [items, searchQuery]);

  const handleSave = async () => {
    if (!editItem?.name || editItem.sellingPrice === undefined) return;
    
    if (editItem.id) {
      await updateItem(editItem as InventoryItem);
    } else {
      await addItem({
        id: uuidv4(),
        name: editItem.name,
        aliases: editItem.aliases || '',
        basePrice: editItem.basePrice || 0,
        sellingPrice: editItem.sellingPrice,
      });
    }
    setEditItem(null);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setItemToDelete(id);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      await deleteItem(itemToDelete);
      setItemToDelete(null);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Inventory List', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);

    const headRow = ["Item Name"];
    if (pdfOptions.showBase) headRow.push("Base Price");
    if (pdfOptions.showSelling) headRow.push("Selling Price");
    if (pdfOptions.showBase && pdfOptions.showSelling) headRow.push("Est. Profit");

    const bodyData = items.map(item => {
        const row = [item.name];
        if (pdfOptions.showBase) row.push(item.basePrice.toFixed(2));
        if (pdfOptions.showSelling) row.push(item.sellingPrice.toFixed(2));
        if (pdfOptions.showBase && pdfOptions.showSelling) row.push((item.sellingPrice - item.basePrice).toFixed(2));
        return row;
    });

    autoTable(doc, {
        startY: 25,
        head: [headRow],
        body: bodyData,
        theme: 'grid',
        headStyles: { fillColor: [249, 115, 22] }, // Primary orange color
        styles: { fontSize: 10 },
        didDrawPage: (data) => {
            doc.setFontSize(8);
            doc.setTextColor(150);
            const text = 'Dev: crisjerez105@gmail.com';
            const pageSize = doc.internal.pageSize;
            const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
            doc.text(text, 14, pageHeight - 10);
        }
    });

    doc.save('inventory.pdf');
    setPdfModalOpen(false);
  };

  const exportJSON = () => {
    const data = JSON.stringify(items, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory.json';
    a.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
           await importInventory(json, replaceInventory);
           alert('Inventory imported successfully');
           setImportMode(false);
        } else {
           alert('Invalid JSON format');
        }
      } catch (err) {
        alert('Error parsing JSON');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 pb-20 space-y-4 h-full flex flex-col">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-primary"
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button onClick={() => setEditItem({})} className="bg-primary text-white p-3 rounded-lg shadow-lg">
          <Plus />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button onClick={() => setPdfModalOpen(true)} className="bg-white px-4 py-2 rounded-lg border text-sm whitespace-nowrap flex items-center gap-2 hover:bg-gray-50"><Download size={14}/> PDF</button>
        <button onClick={exportJSON} className="bg-white px-4 py-2 rounded-lg border text-sm whitespace-nowrap flex items-center gap-2 hover:bg-gray-50"><Download size={14}/> JSON</button>
        <button onClick={() => setImportMode(true)} className="bg-white px-4 py-2 rounded-lg border text-sm whitespace-nowrap flex items-center gap-2 hover:bg-gray-50"><Upload size={14}/> Import</button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredItems.map(item => (
          <div 
            key={item.id} 
            onClick={() => setEditItem(item)} 
            className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center border border-gray-100 cursor-pointer active:scale-[0.99] transition-transform hover:bg-gray-50 relative"
          >
            <div className="flex-1">
              <div className="font-bold text-gray-900 text-lg">{item.name}</div>
              <div className="text-sm text-gray-400 italic">{item.aliases}</div>
              
              <div className="flex items-center gap-4 mt-2">
                 <div className="flex flex-col bg-gray-50 px-2 py-1 rounded border border-gray-100">
                    <span className="text-[10px] uppercase text-gray-500 font-bold">Base</span>
                    <span className="font-medium text-gray-700">{item.basePrice.toFixed(2)}</span>
                 </div>
                 <div className="flex flex-col bg-orange-50 px-2 py-1 rounded border border-orange-100">
                    <span className="text-[10px] uppercase text-primary font-bold">Sell</span>
                    <span className="font-bold text-lg text-primary">{item.sellingPrice.toFixed(2)}</span>
                 </div>
              </div>
            </div>
            
            <div className="flex gap-2 pl-3">
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setEditItem(item); }} 
                className="p-3 text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors"
              >
                <Edit2 size={20} />
              </button>
              <button 
                type="button"
                onClick={(e) => handleDeleteClick(e, item.id)} 
                className="p-3 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 border border-red-100 active:bg-red-200 transition-colors z-10"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit/Add Modal */}
      <Modal
        isOpen={!!editItem && !importMode && !pdfModalOpen}
        onClose={() => setEditItem(null)}
        title={editItem?.id ? 'Edit Item' : 'Add Item'}
      >
        <div className="space-y-4">
           <Input label="Name" value={editItem?.name || ''} onChange={(e) => setEditItem({...editItem, name: e.target.value})} />
           <Input label="Aliases (comma sep)" value={editItem?.aliases || ''} onChange={(e) => setEditItem({...editItem, aliases: e.target.value})} />
           <div className="flex gap-4">
              <Input type="number" label="Base Price" value={editItem?.basePrice || ''} onChange={(e) => setEditItem({...editItem, basePrice: parseFloat(e.target.value)})} />
              <Input type="number" label="Selling Price" value={editItem?.sellingPrice || ''} onChange={(e) => setEditItem({...editItem, sellingPrice: parseFloat(e.target.value)})} />
           </div>
           <Button onClick={handleSave}>Save Item</Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        title="Confirm Deletion"
      >
         <div className="space-y-6 p-2">
            <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-2">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Delete Item?</h3>
                <p className="text-gray-500">
                    Are you sure you want to delete this item? This action cannot be undone.
                </p>
            </div>
            
            <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={() => setItemToDelete(null)}>Cancel</Button>
                <Button variant="danger" onClick={confirmDelete}>Delete Item</Button>
            </div>
         </div>
      </Modal>

      {/* PDF Options Modal */}
      <Modal isOpen={pdfModalOpen} onClose={() => setPdfModalOpen(false)} title="Export PDF Options">
          <div className="space-y-4">
              <p className="text-gray-600">Select which columns to include in the inventory table:</p>
              <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border">
                  <input 
                    type="checkbox" 
                    checked={pdfOptions.showBase} 
                    onChange={(e) => setPdfOptions(p => ({...p, showBase: e.target.checked}))} 
                    className="w-5 h-5 text-primary rounded"
                  />
                  <span className="font-bold">Include Base Price</span>
              </label>
              <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border">
                  <input 
                    type="checkbox" 
                    checked={pdfOptions.showSelling} 
                    onChange={(e) => setPdfOptions(p => ({...p, showSelling: e.target.checked}))} 
                    className="w-5 h-5 text-primary rounded"
                  />
                  <span className="font-bold">Include Selling Price</span>
              </label>
              <Button onClick={generatePDF}>Generate PDF Table</Button>
          </div>
      </Modal>

      {/* Import Modal */}
      <Modal isOpen={importMode} onClose={() => setImportMode(false)} title="Import JSON">
        <div className="space-y-6">
           <div className="bg-yellow-50 p-4 rounded text-sm text-yellow-800 border border-yellow-200">
             Warning: This action will modify your inventory database.
           </div>
           <label className="flex items-center space-x-2">
              <input type="checkbox" checked={replaceInventory} onChange={(e) => setReplaceInventory(e.target.checked)} className="w-5 h-5"/>
              <span>Delete existing inventory before import?</span>
           </label>
           <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center relative">
              <input type="file" accept=".json" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <div className="pointer-events-none">
                 <Upload className="mx-auto text-gray-400 mb-2" />
                 <span className="text-gray-500">Tap to select JSON file</span>
              </div>
           </div>
        </div>
      </Modal>
    </div>
  );
}