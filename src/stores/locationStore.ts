import { create } from 'zustand';
import type { Building, Floor, Cabinet, Equipment, Department } from '@/types';
import apiClient from '@/api/client/apiClient';

interface LocationState {
  buildings: Building[];
  floors: Floor[];
  departments: Department[];
  cabinets: Cabinet[];
  equipment: Equipment[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchData: () => Promise<void>;
  
  addBuilding: (name: string) => Promise<void>;
  updateBuilding: (id: string, name: string) => Promise<void>;
  deleteBuilding: (id: string) => Promise<void>;
  
  addFloor: (buildingId: string, number: number) => Promise<void>;
  deleteFloor: (id: string) => Promise<void>;
  
  addDepartment: (name: string, buildingId?: string, icon?: string, color?: string) => Promise<void>;
  updateDepartment: (id: string, data: Partial<Department>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  
  addCabinet: (buildingId: string, floorId: string, name: string, departmentId?: string) => Promise<void>;
  updateCabinet: (id: string, data: Partial<Cabinet>) => Promise<void>;
  deleteCabinet: (id: string) => Promise<void>;
  
  addEquipment: (equipment: Omit<Equipment, 'id'>) => Promise<void>;
  updateEquipment: (id: string, data: Partial<Equipment>) => Promise<void>;
  deleteEquipment: (id: string) => Promise<void>;
  
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

export const useLocationStore = create<LocationState>((set, get) => ({
  buildings: [],
  floors: [],
  departments: [],
  cabinets: [],
  equipment: [],
  isLoading: false,
  error: null,

  fetchData: async () => {
    set({ isLoading: true, error: null });
    console.log('Fetching registry data...');
    try {
      const testRes = await apiClient.get('/registry/test');
      console.log('Registry API Test:', testRes.data);

      const [buildingsRes, cabinetsRes, departmentsRes, equipmentRes] = await Promise.all([
        apiClient.get('/registry/buildings'),
        apiClient.get('/registry/cabinets'),
        apiClient.get('/registry/departments'),
        apiClient.get('/registry/equipment'),
      ]);

      console.log('Registry data received:', {
        buildings: buildingsRes.data.length,
        cabinets: cabinetsRes.data.length,
        departments: departmentsRes.data.length,
        equipment: equipmentRes.data.length
      });

      const buildings = buildingsRes.data;
      const floors = buildings.flatMap((b: any) => b.floors || []);
      
      set({ 
        buildings, 
        floors,
        cabinets: cabinetsRes.data,
        departments: departmentsRes.data,
        equipment: equipmentRes.data,
        isLoading: false 
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  addBuilding: async (name) => {
    try {
      const res = await apiClient.post('/registry/buildings', { name });
      set(state => ({ buildings: [...state.buildings, res.data] }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  updateBuilding: async (id, name) => {
    try {
      const res = await apiClient.put(`/registry/buildings/${id}`, { name });
      set(state => ({
        buildings: state.buildings.map(b => b.id === id ? res.data : b)
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  deleteBuilding: async (id) => {
    try {
      await apiClient.delete(`/registry/buildings/${id}`);
      set(state => ({
        buildings: state.buildings.filter(b => b.id !== id),
        floors: state.floors.filter(f => f.buildingId !== id),
        cabinets: state.cabinets.filter(c => c.buildingId !== id)
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  addFloor: async (buildingId, number) => {
    try {
      const res = await apiClient.post('/registry/floors', { buildingId, number });
      set(state => ({ floors: [...state.floors, res.data] }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  deleteFloor: async (id) => {
    try {
      await apiClient.delete(`/registry/floors/${id}`);
      set(state => ({
        floors: state.floors.filter(f => f.id !== id),
        cabinets: state.cabinets.filter(c => c.floorId !== id)
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  addDepartment: async (name, buildingId, icon, color) => {
    try {
      const res = await apiClient.post('/registry/departments', { name, buildingId, icon, color });
      set(state => ({ departments: [...state.departments, res.data] }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  updateDepartment: async (id, data) => {
    try {
      const res = await apiClient.put(`/registry/departments/${id}`, data);
      set(state => ({
        departments: state.departments.map(d => d.id === id ? res.data : d)
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  deleteDepartment: async (id) => {
    try {
      await apiClient.delete(`/registry/departments/${id}`);
      set(state => ({
        departments: state.departments.filter(d => d.id !== id),
        cabinets: state.cabinets.map(c => c.departmentId === id ? { ...c, departmentId: undefined } : c)
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  addCabinet: async (buildingId, floorId, name, departmentId) => {
    try {
      const res = await apiClient.post('/registry/cabinets', { buildingId, floorId, name, departmentId });
      set(state => ({ cabinets: [...state.cabinets, res.data] }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  updateCabinet: async (id, data) => {
    try {
      const res = await apiClient.put(`/registry/cabinets/${id}`, data);
      set(state => ({
        cabinets: state.cabinets.map(c => c.id === id ? res.data : c)
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  deleteCabinet: async (id) => {
    try {
      await apiClient.delete(`/registry/cabinets/${id}`);
      set(state => ({
        cabinets: state.cabinets.filter(c => c.id !== id),
        equipment: state.equipment.map(e => e.cabinetId === id ? { ...e, cabinetId: undefined } : e)
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  addEquipment: async (eq) => {
    try {
      const res = await apiClient.post('/registry/equipment', eq);
      set(state => ({ equipment: [...state.equipment, res.data] }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  updateEquipment: async (id, data) => {
    try {
      const res = await apiClient.put(`/registry/equipment/${id}`, data);
      set(state => ({
        equipment: state.equipment.map(e => e.id === id ? res.data : e)
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  deleteEquipment: async (id) => {
    try {
      await apiClient.delete(`/registry/equipment/${id}`);
      set(state => ({
        equipment: state.equipment.filter(e => e.id !== id)
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  // Selectors
  getBuildingById: (id) => get().buildings.find(b => b.id === id),
  getFloorById: (id) => get().floors.find(f => f.id === id),
  getDepartmentById: (id) => get().departments.find(d => d.id === id),
  getCabinetById: (id) => get().cabinets.find(c => c.id === id),
  getEquipmentById: (id) => get().equipment.find(e => e.id === id),
  getEquipmentByModel: (model) => get().equipment.find(e => e.model === model),
  getFloorsByBuilding: (buildingId) => get().floors.filter(f => f.buildingId === buildingId),
  getDepartmentsByBuilding: (buildingId) => get().departments.filter(d => d.buildingId === buildingId),
  getCabinetsByFloor: (floorId) => get().cabinets.filter(c => c.floorId === floorId),
  getCabinetsByDepartment: (departmentId) => get().cabinets.filter(c => c.departmentId === departmentId),
}));
