import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Building, Floor, Cabinet, Equipment, Department } from '@/types';

interface LocationState {
  buildings: Building[];
  floors: Floor[];
  departments: Department[];
  cabinets: Cabinet[];
  equipment: Equipment[];
  
  // Actions
  addBuilding: (name: string) => void;
  updateBuilding: (id: string, name: string) => void;
  deleteBuilding: (id: string) => void;
  
  addFloor: (buildingId: string, number: number) => void;
  deleteFloor: (id: string) => void;
  
  addDepartment: (name: string, buildingId?: string, icon?: string, color?: string) => void;
  updateDepartment: (id: string, data: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;
  
  addCabinet: (buildingId: string, floorId: string, name: string, departmentId?: string) => void;
  updateCabinet: (id: string, data: Partial<Cabinet>) => void;
  deleteCabinet: (id: string) => void;
  
  addEquipment: (equipment: Omit<Equipment, 'id'>) => void;
  updateEquipment: (id: string, data: Partial<Equipment>) => void;
  deleteEquipment: (id: string) => void;
  
  // Selectors
  getBuildingById: (id: string) => Building | undefined;
  getFloorById: (id: string) => Floor | undefined;
  getDepartmentById: (id: string) => Department | undefined;
  getCabinetById: (id: string) => Cabinet | undefined;
  getEquipmentById: (id: string) => Equipment | undefined;
  getEquipmentByModel: (model: string) => Equipment | undefined;
  getFloorsByBuilding: (buildingId: string) => Floor[];
  getDepartmentsByBuilding: (buildingId: string) => Department[];
  getCabinetsByFloor: (floorId: string) => Cabinet[];
  getCabinetsByDepartment: (departmentId: string) => Cabinet[];
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
      departments: [
        { id: 'd1', name: 'ЛКО', icon: 'Stethoscope', color: '#3B82F6' },
        { id: 'd2', name: 'ДО', icon: 'Search', color: '#10B981' },
        { id: 'd3', name: 'КДЛ', icon: 'FlaskConical', color: '#8B5CF6' },
        { id: 'd4', name: 'АХО', icon: 'Building', color: '#6B7280' },
        { id: 'd5', name: 'Хирургия', icon: 'Activity', color: '#EF4444' },
        { id: 'd6', name: 'Клиника Live', icon: 'ClipboardList', color: '#F59E0B' }
      ],
      cabinets: [
        { id: 'c1-101', buildingId: 'b1', floorId: 'f1-1', departmentId: 'd1', name: '101' },
        { id: 'c1-202', buildingId: 'b1', floorId: 'f1-2', departmentId: 'd2', name: '202' },
        { id: 'c2-op1', buildingId: 'b2', floorId: 'f2-1', departmentId: 'd3', name: 'Операционная 1' }
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

      updateBuilding: (id, name) => set(state => ({
        buildings: state.buildings.map(b => b.id === id ? { ...b, name } : b)
      })),

      deleteBuilding: (id) => set(state => ({
        buildings: state.buildings.filter(b => b.id !== id),
        floors: state.floors.filter(f => f.buildingId !== id),
        departments: state.departments.filter(d => d.buildingId !== id),
        cabinets: state.cabinets.filter(c => c.buildingId !== id)
      })),

      addFloor: (buildingId, number) => set(state => ({
        floors: [...state.floors, { id: `f-${Date.now()}`, buildingId, number }]
      })),

      deleteFloor: (id) => set(state => ({
        floors: state.floors.filter(f => f.id !== id),
        cabinets: state.cabinets.filter(c => c.floorId !== id)
      })),

      addDepartment: (name, buildingId, icon, color) => set(state => ({
        departments: [...state.departments, { id: `d-${Date.now()}`, name, buildingId, icon, color }]
      })),

      updateDepartment: (id, data) => set(state => ({
        departments: state.departments.map(d => d.id === id ? { ...d, ...data } : d)
      })),

      deleteDepartment: (id) => set(state => ({
        departments: state.departments.filter(d => d.id !== id),
        cabinets: state.cabinets.map(c => c.departmentId === id ? { ...c, departmentId: undefined } : c)
      })),

      addCabinet: (buildingId, floorId, name, departmentId) => set(state => ({
        cabinets: [...state.cabinets, { id: `c-${Date.now()}`, buildingId, floorId, name, departmentId }]
      })),

      updateCabinet: (id, data) => set(state => ({
        cabinets: state.cabinets.map(c => c.id === id ? { ...c, ...data } : c)
      })),

      deleteCabinet: (id) => set(state => ({
        cabinets: state.cabinets.filter(c => c.id !== id)
      })),

      addEquipment: (eq) => set(state => ({
        equipment: [...state.equipment, { ...eq, id: `e-${Date.now()}` }]
      })),

      updateEquipment: (id, data) => set(state => ({
        equipment: state.equipment.map(e => e.id === id ? { ...e, ...data } : e)
      })),

      deleteEquipment: (id) => set(state => ({
        equipment: state.equipment.filter(e => e.id !== id)
      })),

      getBuildingById: (id) => get().buildings.find(b => b.id === id),
      getFloorById: (id) => get().floors.find(f => f.id === id),
      getDepartmentById: (id) => get().departments.find(d => d.id === id),
      getCabinetById: (id) => get().cabinets.find(c => c.id === id),
      getEquipmentById: (id) => get().equipment.find(e => e.id === id),
      getEquipmentByModel: (model) => get().equipment.find(e => 
        e.model.toLowerCase() === model.toLowerCase() || 
        e.name.toLowerCase() === model.toLowerCase()
      ),
      getFloorsByBuilding: (buildingId) => get().floors.filter(f => f.buildingId === buildingId),
      getDepartmentsByBuilding: (buildingId) => get().departments.filter(d => d.buildingId === buildingId),
      getCabinetsByFloor: (floorId) => get().cabinets.filter(c => c.floorId === floorId),
      getCabinetsByDepartment: (departmentId) => get().cabinets.filter(c => c.departmentId === departmentId)
    }),
    {
      name: 'location-storage'
    }
  )
);
