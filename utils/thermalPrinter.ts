import { Transaction } from '../types';

/**
 * Native Print Fallback.
 * Triggers the system print dialog which is the most reliable path in WebViews/Shells
 * when Web Bluetooth is restricted and RawBT is not desired.
 */
export const printDirectThermal = (transaction: Transaction) => {
  // We use the browser's native print engine.
  // The layout is defined in the hidden 'print:block' in Sales.tsx
  window.print();
};