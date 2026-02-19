import jsPDF from 'jspdf';
import { Transaction } from '../types';

export const generateReceipt = (transaction: Transaction) => {
  const pageWidth = 58;
  const margin = 4; 
  const contentWidth = pageWidth - (margin * 2);
  const baseFontSize = 8.5; 
  const lineHeight = 4.2; 
  
  // Calculate height first
  const ptr = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pageWidth, 1000], 
  });
  
  let y = margin;
  ptr.setFontSize(baseFontSize);
  
  // Measure header
  if (transaction.sellerInfo.name) y += lineHeight;
  if (transaction.sellerInfo.address) y += (ptr.splitTextToSize(transaction.sellerInfo.address, contentWidth).length * lineHeight);
  if (transaction.sellerInfo.contact) y += lineHeight;
  if (transaction.sellerInfo.websiteUrl) y += lineHeight;
  y += 4; // Header separator

  // Measure Items
  transaction.items.forEach((item) => {
    const splitName = ptr.splitTextToSize(item.name, contentWidth);
    y += (splitName.length * lineHeight) + lineHeight + 1; 
  });

  y += 20; // Totals and footer space

  const finalHeight = Math.max(y + 10, 80);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pageWidth, finalHeight],
  });

  doc.setFontSize(baseFontSize);
  doc.setFont('helvetica', 'normal');
  y = margin;

  const centerText = (text: string, isBold = false) => {
    if (!text) return;
    if (isBold) doc.setFont('helvetica', 'bold');
    else doc.setFont('helvetica', 'normal');
    const split = doc.splitTextToSize(text, contentWidth);
    split.forEach((line: string) => {
        const textWidth = doc.getTextWidth(line);
        doc.text(line, (pageWidth - textWidth) / 2, y);
        y += lineHeight;
    });
    doc.setFont('helvetica', 'normal');
  };

  const leftText = (text: string) => {
    doc.text(text, margin, y);
  };

  const rightText = (text: string) => {
    const textWidth = doc.getTextWidth(text);
    doc.text(text, pageWidth - margin - textWidth, y);
  };

  // 1. Business Identity (Reflecting Official Settings)
  if (transaction.sellerInfo.name) centerText(transaction.sellerInfo.name.toUpperCase(), true);
  if (transaction.sellerInfo.address) centerText(transaction.sellerInfo.address);
  if (transaction.sellerInfo.contact) centerText(`Tel: ${transaction.sellerInfo.contact}`);
  if (transaction.sellerInfo.websiteUrl) centerText(transaction.sellerInfo.websiteUrl);
  
  y += 1;
  doc.setLineWidth(0.1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // 2. Receipt Metadata
  doc.setFontSize(7);
  leftText(`No: ${transaction.id.slice(-8).toUpperCase()}`);
  rightText(new Date(transaction.timestamp).toLocaleString());
  y += lineHeight;
  leftText(`Pay: ${transaction.paymentType.toUpperCase()}`);
  if (transaction.customer?.name) { 
    y += lineHeight;
    leftText(`Cust: ${transaction.customer.name}`); 
  }
  y += 2;
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // 3. Itemized List (Requested Format)
  doc.setFontSize(baseFontSize);
  transaction.items.forEach((item) => {
    const itemTotal = (item.manualTotal ?? (item.sellingPrice * item.quantity));
    
    // Name on its own line
    const splitName = doc.splitTextToSize(item.name, contentWidth);
    doc.text(splitName, margin, y);
    y += (splitName.length * lineHeight);
    
    // Details on next line: Qty x Price [Space] Subtotal
    doc.setFontSize(7.5);
    const details = `${item.quantity} x ${item.sellingPrice.toFixed(2)}`;
    doc.text(details, margin + 2, y);
    rightText(itemTotal.toFixed(2));
    y += lineHeight + 1;
    doc.setFontSize(baseFontSize);
  });

  y += 2;
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // 4. Totals
  leftText("Total Due:"); rightText(transaction.total.toFixed(2)); y += lineHeight;
  leftText("Paid:"); rightText(transaction.amountPaid.toFixed(2)); y += lineHeight;
  if (transaction.changeDue > 0) { leftText("Change:"); rightText(transaction.changeDue.toFixed(2)); y += lineHeight; }
  if (transaction.remainingBalance > 0) { 
    doc.setFont('helvetica', 'bold');
    leftText("BALANCE:"); rightText(transaction.remainingBalance.toFixed(2)); 
    doc.setFont('helvetica', 'normal');
    y += lineHeight; 
  }

  y += 4;
  if (transaction.sellerInfo.returnPolicy) {
    doc.setFontSize(6.5);
    const policySplit = doc.splitTextToSize(transaction.sellerInfo.returnPolicy, contentWidth);
    policySplit.forEach((line: string) => {
        doc.text(line, margin, y);
        y += 3;
    });
  }

  y += 4;
  centerText("Thank you for your business!");
  
  const pdfOutput = doc.output('bloburl');
  window.open(pdfOutput, '_blank');
};