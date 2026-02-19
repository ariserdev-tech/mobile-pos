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
    
    // 1. Business Identity
    this.alignCenter();
    if (tx.sellerInfo.name) this.text(`${tx.sellerInfo.name.toUpperCase()}\n`);
    if (tx.sellerInfo.address) this.text(`${tx.sellerInfo.address}\n`);
    if (tx.sellerInfo.contact) this.text(`Tel: ${tx.sellerInfo.contact}\n`);
    if (tx.sellerInfo.websiteUrl) this.text(`${tx.sellerInfo.websiteUrl}\n`);
    this.line();

    // 2. Receipt Meta
    this.alignLeft();
    this.text(`No: ${tx.id.slice(-8).toUpperCase()}  ${new Date(tx.timestamp).toLocaleDateString()}\n`);
    this.text(`Type: ${tx.paymentType.toUpperCase()}\n`);
    if (tx.customer?.name) this.text(`Cust: ${tx.customer.name}\n`);
    this.line();

    // 3. Itemized List (Format: Name \n Details)
    tx.items.forEach(item => {
      // Line 1: Item Name
      this.text(`${item.name}\n`);
      
      // Line 2: Qty x Price then Subtotal
      const details = `${item.quantity} x ${item.sellingPrice.toFixed(2)}`;
      const subtotal = (item.manualTotal ?? (item.sellingPrice * item.quantity)).toFixed(2);
      
      // Calculate padding for right alignment of subtotal (32 chars total width)
      const paddingCount = 32 - details.length - subtotal.length - 1;
      const padding = " ".repeat(Math.max(1, paddingCount));
      
      this.text(` ${details}${padding}${subtotal}\n`);
    });
    this.line();

    // 4. Totals
    this.alignRight();
    this.text(`TOTAL DUE: ${tx.total.toFixed(2)}\n`);
    this.text(`PAID: ${tx.amountPaid.toFixed(2)}\n`);
    if (tx.changeDue > 0) this.text(`CHANGE: ${tx.changeDue.toFixed(2)}\n`);
    if (tx.remainingBalance > 0) this.text(`BALANCE: ${tx.remainingBalance.toFixed(2)}\n`);
    
    this.alignCenter();
    this.text("\nThank you for shopping!\n");
    if (tx.sellerInfo.returnPolicy) {
      this.text(`\n${tx.sellerInfo.returnPolicy}\n`);
    }

    this.write([LF, LF, LF, LF]); // Feed lines for tearing
    
    return new Uint8Array(this.buffer);
  }
}