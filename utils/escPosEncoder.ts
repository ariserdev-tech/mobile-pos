
import { Transaction } from '../types';

const ESC = 0x1B;
const LF = 0x0A;

export class EscPosEncoder {
  private buffer: number[] = [];
  private encoder = new TextEncoder();

  private write(data: number | number[] | Uint8Array) {
    if (data instanceof Uint8Array) {
      this.buffer.push(...Array.from(data));
    } else if (Array.isArray(data)) {
      this.buffer.push(...data);
    } else {
      this.buffer.push(data);
    }
  }

  initialize() {
    this.write([ESC, 0x40]);
    return this;
  }

  alignCenter() {
    this.write([ESC, 0x61, 1]);
    return this;
  }

  alignLeft() {
    this.write([ESC, 0x61, 0]);
    return this;
  }

  alignRight() {
    this.write([ESC, 0x61, 2]);
    return this;
  }

  lineFeed(count: number = 1) {
    for (let i = 0; i < count; i++) this.write(LF);
    return this;
  }

  text(content: string) {
    this.write(this.encoder.encode(content));
    return this;
  }

  line(char: string = '-') {
    this.text(char.repeat(32) + '\n');
    return this;
  }

  encodeTransaction(tx: Transaction) {
    this.initialize();
    
    // 1. Business Info
    this.alignCenter();
    if (tx.sellerInfo.name) this.text(`${tx.sellerInfo.name.toUpperCase()}\n`);
    if (tx.sellerInfo.address) this.text(`${tx.sellerInfo.address}\n`);
    if (tx.sellerInfo.contact) this.text(`Tel: ${tx.sellerInfo.contact}\n`);
    if (tx.sellerInfo.websiteUrl) this.text(`${tx.sellerInfo.websiteUrl}\n`);
    if (tx.sellerInfo.name || tx.sellerInfo.address || tx.sellerInfo.contact || tx.sellerInfo.websiteUrl) this.line();

    // 2. Receipt Info
    this.alignLeft();
    this.text(`Receipt Number: ${tx.id.slice(-8).toUpperCase()}\n`);
    this.text(`Date: ${new Date(tx.timestamp).toLocaleString()}\n`);
    this.text(`Payment Type: ${tx.paymentType.toUpperCase()}\n`);
    if (tx.customer?.name) this.text(`Customer: ${tx.customer.name}\n`);
    this.line();

    // 3. Itemized List
    tx.items.forEach(item => {
      const name = item.name.length > 32 ? item.name.slice(0, 29) + '...' : item.name;
      this.text(`${name}\n`);
      const qtyText = `${item.quantity} Qty x ${item.sellingPrice.toFixed(2)} Unit Price`;
      const totalText = (item.manualTotal ?? (item.sellingPrice * item.quantity)).toFixed(2);
      this.text(` ${qtyText.padEnd(20)} ${totalText.padStart(10)}\n`);
    });
    this.line();

    // 4 & 5. Totals
    this.alignRight();
    this.text(`Total Amount Due: ${tx.total.toFixed(2)}\n`);
    this.text(`Amount Paid: ${tx.amountPaid.toFixed(2)}\n`);
    if (tx.changeDue > 0) this.text(`Change Due: ${tx.changeDue.toFixed(2)}\n`);
    if (tx.remainingBalance > 0) this.text(`Remaining Balance: ${tx.remainingBalance.toFixed(2)}\n`);
    this.line();

    // 6. Policy
    this.alignCenter();
    if (tx.sellerInfo.returnPolicy) {
        this.text(`${tx.sellerInfo.returnPolicy}\n`);
    }
    
    // 7. Footer
    this.text("\nThank you for shopping with us!\n");
    this.text("For POS inquiries, contact:\n");
    this.text("ariserdev@gmail.com\n");

    this.lineFeed(4); 
    
    return new Uint8Array(this.buffer);
  }
}
