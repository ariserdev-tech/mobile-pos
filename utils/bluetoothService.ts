import { Transaction } from '../types';
import { EscPosEncoder } from './escPosEncoder';

class BluetoothPrinterService {
  private device: any = null;
  private characteristic: any = null;

  /**
   * Checks if Web Bluetooth is supported.
   * In most WebViews (Median.co, Cordova, etc.), this returns false.
   */
  async isSupported(): Promise<boolean> {
    const nav = navigator as any;
    // Explicitly check for bluetooth API and that we aren't in a restricted WebView
    return !!(nav.bluetooth && typeof nav.bluetooth.requestDevice === 'function');
  }

  /**
   * Only works in full browsers (Chrome/Edge). 
   * For WebViews, this will throw an error handled by the UI to use the Direct Link.
   */
  async connect(): Promise<string> {
    const nav = navigator as any;
    
    if (!nav.bluetooth) {
      throw new Error('WEB_BLUETOOTH_UNSUPPORTED');
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