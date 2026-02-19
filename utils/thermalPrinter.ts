import { Transaction } from '../types';

/**
 * Formats a transaction into a plain text receipt suitable for 58mm thermal printers.
 * Strictly follows the requested professional layout.
 */
export const formatThermalReceipt = (transaction: Transaction): string => {
  const line = "--------------------------------\n"; // 32 chars
  let receipt = "";

  // 1. Business Information
  if (transaction.sellerInfo.name) receipt += `${transaction.sellerInfo.name.toUpperCase()}\n`;
  if (transaction.sellerInfo.address) receipt += `${transaction.sellerInfo.address}\n`;
  if (transaction.sellerInfo.contact) receipt += `Tel: ${transaction.sellerInfo.contact}\n`;
  if (transaction.sellerInfo.websiteUrl) receipt += `${transaction.sellerInfo.websiteUrl}\n`;
  if (transaction.sellerInfo.name || transaction.sellerInfo.address || transaction.sellerInfo.contact || transaction.sellerInfo.websiteUrl) receipt += line;

  // 2. Receipt Information
  receipt += `Receipt Number: ${transaction.id.slice(-8).toUpperCase()}\n`;
  receipt += `Date: ${new Date(transaction.timestamp).toLocaleString()}\n`;
  receipt += `Payment Type: ${transaction.paymentType.toUpperCase()}\n`;
  if (transaction.customer?.name) receipt += `Customer: ${transaction.customer.name}\n`;
  receipt += line;

  // 3. Itemized List
  receipt += "ITEM            QTY       TOTAL\n";
  transaction.items.forEach(item => {
    const itemTotal = (item.manualTotal ?? (item.sellingPrice * item.quantity));
    // Wrap name manually if needed (32 chars line)
    const name = item.name.length > 32 ? item.name.slice(0, 29) + '...' : item.name;
    receipt += `${name}\n`;
    const qtyText = `${item.quantity} Qty x ${item.sellingPrice.toFixed(2)}`;
    receipt += ` ${qtyText.padEnd(20)} ${itemTotal.toFixed(2).padStart(10)}\n`;
  });
  receipt += line;

  // 4 & 5. Totals
  receipt += `Total Due: ${transaction.total.toFixed(2).padStart(21)}\n`;
  receipt += `Amount Paid: ${transaction.amountPaid.toFixed(2).padStart(19)}\n`;
  if (transaction.changeDue > 0) {
    receipt += `Change Due: ${transaction.changeDue.toFixed(2).padStart(20)}\n`;
  }
  if (transaction.remainingBalance > 0) {
    receipt += `Remaining Bal: ${transaction.remainingBalance.toFixed(2).padStart(17)}\n`;
  }
  receipt += line;

  // 6. Return Policy
  if (transaction.sellerInfo.returnPolicy) {
    receipt += `${transaction.sellerInfo.returnPolicy}\n\n`;
  }

  // 7. Footer
  receipt += " Thank you for shopping with us!\n";
  receipt += " For POS inquiries, contact:\n";
  receipt += " ariserdev@gmail.com\n\n\n\n";

  return receipt;
};

/**
 * Attempts to print using the RawBT protocol (common for Android thermal printers).
 * This works outside of the browser's Bluetooth restrictions by delegating to a local app.
 */
export const printDirectThermal = (transaction: Transaction) => {
  const text = formatThermalReceipt(transaction);
  const encodedText = encodeURIComponent(text);
  const url = `rawbt:print?text=${encodedText}`;
  window.location.href = url;
};