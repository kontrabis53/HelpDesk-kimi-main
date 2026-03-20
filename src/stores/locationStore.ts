import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Building, Floor, Cabinet, Equipment } from '@/types';

interface LocationState {
  buildings: Building[];
  floors: Floor[];
  cabinets: Cabinet[];
  equipment: Equipment[];
  
  // Actions
  addBuilding: (name: string) => void;
  addFloor: (buildingId: string, number: number) => void;
  addCabinet: (buildingId: string, floorId: string, name: string) => void;
  addEquipment: (equipment: Omit<Equipment, 'id'>) => void;
  
  // Selectors
  getBuildingById: (id: string) => Building | undefined;
  getFloorById: (id: string) => Floor | undefined;
  getCabinetById: (id: string) => Cabinet | undefined;
  getEquipmentById: (id: string) => Equipment | undefined;
  getEquipmentByModel: (model: string) => Equipment | undefined;
  getCabinetsByFloor: (floorId: string) => Cabinet[];
  getFloorsByBuilding: (buildingId: string) => Floor[];
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      buildings: [
        { id: 'b1', name: 'Корпус А (Главный)' },
        { id: 'b2', name: 'Корпус Б (Хирургия)' }
      ],
      floors: [
        { id: 'f1-1', buildingId: 'b1', number: 1 },
        { id: 'f1-2', buildingId: 'b1', number: 2 },
        { id: 'f2-1', buildingId: 'b2', number: 1 }
      ],
      cabinets: [
        { id: 'c1-101', buildingId: 'b1', floorId: 'f1-1', name: '101' },
        { id: 'c1-202', buildingId: 'b1', floorId: 'f1-2', name: '202' },
        { id: 'c2-op1', buildingId: 'b2', floorId: 'f2-1', name: 'Операционная 1' }
      ],
      equipment: [
        { 
          id: 'e1', 
          name: 'Hamilton C3', 
          model: 'Hamilton C3', 
          serialNumber: 'SN123456', 
          cabinetId: 'c2-op1', 
          department: 'Реанимация' 
        }
      ],

      addBuilding: (name) => set(state => ({
        buildings: [...state.buildings, { id: `b-${Date.now()}`, name }]
      })),

      addFloor: (buildingId, number) => set(state => ({
        floors: [...state.floors, { id: `f-${Date.now()}`, buildingId, number }]
      })),

      addCabinet: (buildingId, floorId, name) => set(state => ({
        cabinets: [...state.cabinets, { id: `c-${Date.now()}`, buildingId, floorId, name }]
      })),

      addEquipment: (eq) => set(state => ({
        equipment: [...state.equipment, { ...eq, id: `e-${Date.now()}` }]
      })),

      getBuildingById: (id) => get().buildings.find(b => b.id === id),
      getFloorById: (id) => get().floors.find(f => f.id === id),
      getCabinetById: (id) => get().cabinets.find(c => c.id === id),
      getEquipmentById: (id) => get().equipment.find(e => e.id === id),
      getEquipmentByModel: (model) => get().equipment.find(e => 
        e.model.toLowerCase().includes(model.toLowerCase()) || 
        e.name.toLowerCase().includes(model.toLowerCase())
      ),
      getCabinetsByFloor: (floorId) => get().cabinets.filter(c => c.floorId === floorId),
      getFloorsByBuilding: (buildingId) => get().floors.filter(f => f.buildingId === buildingId)
    }),
    {
      name: 'location-storage'
    }
  )
);
