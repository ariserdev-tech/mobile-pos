import { Transaction } from '../types';
import { EscPosEncoder } from './escPosEncoder';

class BluetoothPrinterService {
  private device: any = null;
  private characteristic: any = null;

  /**
   * Forcefully returns true to allow discovery attempts even in restricted environments.
   */
  async isSupported(): Promise<boolean> {
    return true;
  }

  /**
   * Attempts to connect to a Bluetooth device.
   */
  async connect(): Promise<string> {
    const nav = navigator as any;
    
    // Even if nav.bluetooth is missing, we try to access it to trigger any potential polyfills or bridges
    if (!nav.bluetooth) {
      throw new Error('Bluetooth API not found. Please ensure Bluetooth is enabled in your app settings.');
    }

    try {
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

      if (!this.characteristic) throw new Error('No writable channel found.');
      return this.device.name || 'Printer';
    } catch (error: any) {
      if (error.name === 'NotFoundError') throw new Error('Discovery cancelled.');
      throw error;
    }
  }

  async print(tx: Transaction) {
    if (!this.characteristic || !this.device?.gatt?.connected) {
      throw new Error('NOT_CONNECTED');
    }

    const encoder = new EscPosEncoder();
    const data = encoder.encodeTransaction(tx);
    const chunkSize = 20;
    for (let i = 0; i < data.length; i += chunkSize) {
      await this.characteristic.writeValue(data.slice(i, i + chunkSize));
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