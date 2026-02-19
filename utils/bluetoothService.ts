import { Transaction } from '../types';
import { EscPosEncoder } from './escPosEncoder';

class BluetoothPrinterService {
  private device: any = null;
  private characteristic: any = null;

  /**
   * Checks if Web Bluetooth is supported and enabled.
   * Native shells often return false or undefined here.
   */
  async isSupported(): Promise<boolean> {
    const nav = navigator as any;
    if (!nav.bluetooth) return false;
    
    try {
      if (typeof nav.bluetooth.getAvailability === 'function') {
        return await nav.bluetooth.getAvailability();
      }
      return true;
    } catch (e: any) {
      return false;
    }
  }

  /**
   * Triggers the browser's Bluetooth scan and permission request.
   */
  async connect(): Promise<string> {
    const nav = navigator as any;
    
    if (!nav.bluetooth) {
      throw new Error('Web Bluetooth is restricted in this environment. Please use the "Direct Print (RawBT)" option for native shells.');
    }

    try {
      // Common Thermal Printer Service UUIDs
      const commonServices = [
        '000018f0-0000-1000-8000-00805f9b34fb', 
        '0000ffe0-0000-1000-8000-00805f9b34fb', 
        'e7e11101-4966-4a54-8e88-548178849a9c',
        '0000af06-0000-1000-8000-00805f9b34fb'
      ];

      this.device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: commonServices
      });

      if (!this.device.gatt) throw new Error('GATT communication not supported by this device.');
      
      const server = await this.device.gatt.connect();
      const services = await server.getPrimaryServices();
      
      for (const service of services) {
        try {
          const characteristics = await service.getCharacteristics();
          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              this.characteristic = char;
              break;
            }
          }
        } catch (e) { continue; }
        if (this.characteristic) break;
      }

      if (!this.characteristic) throw new Error('Could not find a writable channel on this printer.');

      return this.device.name || 'Thermal Printer';
    } catch (error: any) {
      if (error.name === 'NotFoundError') throw new Error('Scan cancelled. No device was selected.');
      if (error.name === 'SecurityError') throw new Error('Bluetooth access blocked. Check app permissions.');
      throw error;
    }
  }

  async print(tx: Transaction) {
    if (!this.characteristic || !this.device?.gatt?.connected) {
      throw new Error('No printer linked.');
    }

    try {
      const encoder = new EscPosEncoder();
      const data = encoder.encodeTransaction(tx);
      
      // Send data in 20-byte chunks to accommodate BLE MTU limits
      const chunkSize = 20;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        await this.characteristic.writeValue(chunk);
      }
    } catch (error: any) {
      throw new Error('Print failed: ' + error.message);
    }
  }

  get isConnected(): boolean {
    return !!this.characteristic && !!this.device?.gatt?.connected;
  }

  get deviceName(): string {
    return this.device?.name || 'None';
  }
}

export const btPrinter = new BluetoothPrinterService();