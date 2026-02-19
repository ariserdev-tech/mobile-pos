
import jsPDF from 'jspdf';
import { Transaction } from '../types';

export const generateReceipt = (transaction: Transaction) => {
  const pageWidth = 58;
  const margin = 5; 
  const contentWidth = pageWidth - (margin * 2);
  const baseFontSize = 8.5; 
  const lineHeight = 4.2; 
  
  const ptr = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pageWidth, 1000], 
  });
  
  let y = margin;
  ptr.setFontSize(baseFontSize);
  ptr.setFont('helvetica', 'normal');

  // Business Info
  if (transaction.sellerInfo.name) y += lineHeight;
  if (transaction.sellerInfo.address) y += (ptr.splitTextToSize(transaction.sellerInfo.address, contentWidth).length * lineHeight);
  if (transaction.sellerInfo.contact) y += lineHeight;
  if (transaction.sellerInfo.websiteUrl) y += lineHeight;
  if (transaction.sellerInfo.name || transaction.sellerInfo.address || transaction.sellerInfo.contact || transaction.sellerInfo.websiteUrl) y += 2;

  // Receipt Info
  y += lineHeight * 4; 
  y += 2;

  // Items
  transaction.items.forEach((item) => {
    const splitName = ptr.splitTextToSize(item.name, contentWidth);
    y += (splitName.length * lineHeight) + lineHeight; 
  });

  y += 2;
  y += lineHeight * 4; 
  
  if (transaction.sellerInfo.returnPolicy) {
    const policyLines = ptr.splitTextToSize(transaction.sellerInfo.returnPolicy, contentWidth);
    y += (policyLines.length * lineHeight) + 2;
  }
  
  y += lineHeight * 5; 

  const finalHeight = Math.max(y + 10, 60);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pageWidth, finalHeight],
  });

  doc.setFontSize(baseFontSize);
  doc.setFont('helvetica', 'normal');
  y = margin;

  const centerText = (text: string) => {
    if (!text) return;
    const split = doc.splitTextToSize(text, contentWidth);
    split.forEach((line: string) => {
        const textWidth = doc.getTextWidth(line);
        doc.text(line, (pageWidth - textWidth) / 2, y);
        y += lineHeight;
    });
  };

  const leftText = (text: string) => {
    doc.text(text, margin, y);
  };

  const rightText = (text: string) => {
    const textWidth = doc.getTextWidth(text);
    doc.text(text, pageWidth - margin - textWidth, y);
  };

  // 1. Business Information
  if (transaction.sellerInfo.name) centerText(transaction.sellerInfo.name.toUpperCase());
  if (transaction.sellerInfo.address) centerText(transaction.sellerInfo.address);
  if (transaction.sellerInfo.contact) centerText(`Tel: ${transaction.sellerInfo.contact}`);
  if (transaction.sellerInfo.websiteUrl) centerText(transaction.sellerInfo.websiteUrl);
  
  if (transaction.sellerInfo.name || transaction.sellerInfo.address || transaction.sellerInfo.contact || transaction.sellerInfo.websiteUrl) {
    y += 1;
    doc.setLineWidth(0.1);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
  }

  // 2. Receipt Information
  leftText(`Receipt Number: ${transaction.id.slice(-8).toUpperCase()}`); y += lineHeight;
  leftText(`Date: ${new Date(transaction.timestamp).toLocaleString()}`); y += lineHeight;
  leftText(`Payment Type: ${transaction.paymentType.toUpperCase()}`); y += lineHeight;
  if (transaction.customer?.name) { leftText(`Customer: ${transaction.customer.name}`); y += lineHeight; }

  y += 1;
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // 3. Itemized List
  transaction.items.forEach((item) => {
    const itemTotal = (item.manualTotal ?? (item.sellingPrice * item.quantity));
    const splitName = doc.splitTextToSize(item.name, contentWidth - 15);
    doc.text(splitName, margin, y);
    rightText(itemTotal.toFixed(2));
    y += (splitName.length * lineHeight);
    
    doc.text(`${item.quantity} Qty x ${item.sellingPrice.toFixed(2)} Unit Price`, margin + 2, y);
    y += lineHeight;
  });

  y += 1;
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // 4 & 5. Totals
  leftText("Total Amount Due:"); rightText(transaction.total.toFixed(2)); y += lineHeight;
  leftText("Amount Paid:"); rightText(transaction.amountPaid.toFixed(2)); y += lineHeight;
  if (transaction.changeDue > 0) { leftText("Change Due:"); rightText(transaction.changeDue.toFixed(2)); y += lineHeight; }
  if (transaction.remainingBalance > 0) { leftText("Remaining Balance:"); rightText(transaction.remainingBalance.toFixed(2)); y += lineHeight; }

  y += 2;
  // 6. Return Policy
  if (transaction.sellerInfo.returnPolicy) {
    const policySplit = doc.splitTextToSize(transaction.sellerInfo.returnPolicy, contentWidth);
    policySplit.forEach((line: string) => {
        doc.text(line, margin, y);
        y += lineHeight;
    });
  }

  y += 4;
  // 7. Footer
  centerText("Thank you for shopping with us!");
  y += 1;
  centerText("For POS inquiries, please contact:");
  centerText("ariserdev@gmail.com");
  
  y += 2;
  doc.setLineDash([1, 1], 0);
  doc.line(margin, y, pageWidth - margin, y);

  const pdfOutput = doc.output('bloburl');
  window.open(pdfOutput, '_blank');
};
