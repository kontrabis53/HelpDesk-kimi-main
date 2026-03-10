import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Device, NetworkScanResult } from '@/types';

interface ParserStore {
  devices: Device[];
  scanHistory: NetworkScanResult[];
  isScanning: boolean;
  lastScanTime: string | null;
  
  startScan: () => Promise<void>;
  getStats: () => {
    total: number;
    online: number;
    withApp: number;
    osDist: Record<string, number>;
  };
}

const mockDevices: Device[] = [
  {
    id: '1',
    ipAddress: '192.168.1.10',
    macAddress: '00:1A:2B:3C:4D:5E',
    hostname: 'MEDIN-REC-01',
    status: 'online',
    lastSeen: new Date().toISOString(),
    os: 'Windows 11',
    openPorts: [80, 443, 3389],
    services: ['HTTP', 'HTTPS', 'RDP'],
    hasAppRunning: true,
  },
  {
    id: '2',
    ipAddress: '192.168.1.11',
    macAddress: '00:1A:2B:3C:4D:5F',
    hostname: 'MEDIN-CC-01',
    status: 'online',
    lastSeen: new Date().toISOString(),
    os: 'Windows 10',
    openPorts: [80, 443],
    services: ['HTTP', 'HTTPS'],
    hasAppRunning: true,
  },
  {
    id: '3',
    ipAddress: '192.168.1.15',
    macAddress: '00:1A:2B:3C:4D:60',
    hostname: 'MEDIN-ADMIN-PC',
    status: 'online',
    lastSeen: new Date().toISOString(),
    os: 'Windows 11',
    openPorts: [80, 443, 22, 3389],
    services: ['HTTP', 'HTTPS', 'SSH', 'RDP'],
    hasAppRunning: true,
  },
  {
    id: '4',
    ipAddress: '192.168.1.20',
    macAddress: '00:1A:2B:3C:4D:61',
    hostname: 'MEDIN-PRINTER-01',
    status: 'online',
    lastSeen: new Date().toISOString(),
    os: 'Embedded RTOS',
    openPorts: [80, 515, 9100],
    services: ['HTTP', 'LPD', 'RAW'],
    hasAppRunning: false,
  },
  {
    id: '5',
    ipAddress: '192.168.1.50',
    macAddress: '00:1A:2B:3C:4D:62',
    hostname: 'MEDIN-LAPTOP-05',
    status: 'offline',
    lastSeen: new Date(Date.now() - 86400000).toISOString(),
    os: 'Windows 10',
    openPorts: [],
    services: [],
    hasAppRunning: false,
  },
];

const generateScanHistory = (): NetworkScanResult[] => {
  const history: NetworkScanResult[] = [];
  const now = Date.now();
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now - i * 3600000).toISOString();
    history.push({
      timestamp: time,
      onlineDevices: Math.floor(Math.random() * 10) + 15,
      totalDevices: 30,
      devicesWithApp: Math.floor(Math.random() * 5) + 10,
    });
  }
  return history;
};

export const useParserStore = create<ParserStore>()(
  persist(
    (set, get) => ({
      devices: mockDevices,
      scanHistory: generateScanHistory(),
      isScanning: false,
      lastScanTime: new Date().toISOString(),

      startScan: async () => {
        set({ isScanning: true });
        // Симуляция задержки сканирования
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const newScan: NetworkScanResult = {
          timestamp: new Date().toISOString(),
          onlineDevices: Math.floor(Math.random() * 5) + 20,
          totalDevices: 30,
          devicesWithApp: Math.floor(Math.random() * 5) + 12,
        };

        set(state => ({
          isScanning: false,
          lastScanTime: new Date().toISOString(),
          scanHistory: [...state.scanHistory.slice(-23), newScan]
        }));
      },

      getStats: () => {
        const { devices } = get();
        const stats = {
          total: devices.length,
          online: devices.filter(d => d.status === 'online').length,
          withApp: devices.filter(d => d.hasAppRunning).length,
          osDist: {} as Record<string, number>,
        };

        devices.forEach(d => {
          stats.osDist[d.os] = (stats.osDist[d.os] || 0) + 1;
        });

        return stats;
      }
    }),
    {
      name: 'helpdesk-parser-storage'
    }
  )
);
