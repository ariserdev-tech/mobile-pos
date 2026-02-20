import jsPDF from 'jspdf';
import { Transaction } from '../types';

export const generateReceipt = (transaction: Transaction) => {
  const pageWidth = 58;
  const margin = 4; 
  const contentWidth = pageWidth - (margin * 2);
  const baseFontSize = 7.5; 
  const lineHeight = 3.8; 
  
  // Calculate height first
  const ptr = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pageWidth, 1000], 
  });
  
  let y = margin;
  ptr.setFontSize(baseFontSize);
  
  // Measure header
  if (transaction.sellerInfo.name) y += lineHeight + 1;
  if (transaction.sellerInfo.address) y += (ptr.splitTextToSize(transaction.sellerInfo.address, contentWidth).length * (lineHeight - 0.5));
  if (transaction.sellerInfo.contact) y += lineHeight;
  if (transaction.sellerInfo.websiteUrl) y += lineHeight;
  y += 2; // Header separator

  // Measure Items
  transaction.items.forEach((item) => {
    const splitName = ptr.splitTextToSize(item.name, contentWidth);
    y += (splitName.length * lineHeight) + lineHeight + 1; 
  });

  y += 15; // Totals and footer space

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
  if (transaction.sellerInfo.name) {
    doc.setFontSize(8.5);
    centerText((transaction.sellerInfo.name || '').toUpperCase(), true);
    doc.setFontSize(baseFontSize);
  }
  if (transaction.sellerInfo.address) {
    doc.setFontSize(6.5);
    centerText(transaction.sellerInfo.address);
    doc.setFontSize(baseFontSize);
  }
  if (transaction.sellerInfo.contact) {
    doc.setFontSize(6.5);
    centerText(`Tel: ${transaction.sellerInfo.contact}`);
    doc.setFontSize(baseFontSize);
  }
  if (transaction.sellerInfo.websiteUrl) {
    doc.setFontSize(6.5);
    centerText(transaction.sellerInfo.websiteUrl);
    doc.setFontSize(baseFontSize);
  }
  
  y += 1;
  doc.setLineWidth(0.1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 3;

  // 2. Receipt Metadata
  doc.setFontSize(6);
  leftText(`No: ${(transaction.id || '').slice(-8).toUpperCase()}`);
  rightText(new Date(transaction.timestamp).toLocaleDateString());
  y += lineHeight;
  leftText(`Pay: ${(transaction.paymentType || '').toUpperCase()}`);
  if (transaction.customer?.name) { 
    y += lineHeight;
    leftText(`Cust: ${transaction.customer.name}`); 
  }
  y += 1.5;
  doc.line(margin, y, pageWidth - margin, y);
  y += 3;

  // 3. Itemized List (Requested Format)
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  leftText("ITEM");
  doc.text("QTY", margin + 30, y);
  rightText("TOTAL");
  y += lineHeight;
  doc.line(margin, y, pageWidth - margin, y);
  y += 2;
  doc.setFont('helvetica', 'normal');

  doc.setFontSize(baseFontSize);
  transaction.items.forEach((item) => {
    const itemTotal = (item.manualTotal ?? (item.sellingPrice * item.quantity));
    
    // Name on its own line
    doc.setFont('helvetica', 'bold');
    const splitName = doc.splitTextToSize(item.name, contentWidth);
    doc.text(splitName, margin, y);
    y += (splitName.length * lineHeight);
    
    // Details on next line: Qty x Price [Space] Subtotal
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    const details = `${item.quantity} x ${item.sellingPrice.toFixed(2)}`;
    doc.text(details, margin + 2, y);
    rightText(itemTotal.toFixed(2));
    y += lineHeight + 1;
    doc.setFontSize(baseFontSize);
  });

  y += 1;
  doc.line(margin, y, pageWidth - margin, y);
  y += 3;

  // 4. Totals
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  leftText("TOTAL DUE:"); rightText(transaction.total.toFixed(2)); y += lineHeight + 0.5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  leftText("Paid:"); rightText(transaction.amountPaid.toFixed(2)); y += lineHeight;
  if (transaction.changeDue > 0) { leftText("Change:"); rightText(transaction.changeDue.toFixed(2)); y += lineHeight; }
  if (transaction.remainingBalance > 0) { 
    doc.setFont('helvetica', 'bold');
    leftText("BALANCE:"); rightText(transaction.remainingBalance.toFixed(2)); 
    doc.setFont('helvetica', 'normal');
    y += lineHeight; 
  }

  y += 3;
  if (transaction.sellerInfo.returnPolicy) {
    doc.setFontSize(5.5);
    const policySplit = doc.splitTextToSize(transaction.sellerInfo.returnPolicy, contentWidth);
    policySplit.forEach((line: string) => {
        doc.text(line, margin, y);
        y += 2.5;
    });
  }

  y += 3;
  doc.setFontSize(7);
  centerText("Thank you for your business!");
  
  const pdfOutput = doc.output('bloburl');
  window.open(pdfOutput, '_blank');
};