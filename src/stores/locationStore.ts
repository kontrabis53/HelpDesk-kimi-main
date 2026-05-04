import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  isLocked: boolean;
  
  // Actions
  fetchData: () => Promise<void>;
  setIsLocked: (locked: boolean) => void;
  initSocketListeners: () => () => void;
  
  addBuilding: (name: string) => Promise<void>;
  updateBuilding: (id: string, data: Partial<Building>) => Promise<void>;
  deleteBuilding: (id: string) => Promise<void>;
  
  addFloor: (buildingId: string, number: number) => Promise<void>;
  updateFloor: (id: string, number: number) => Promise<void>;
  deleteFloor: (id: string) => Promise<void>;
  
  addDepartment: (name: string, buildingId?: string, icon?: string, color?: string) => Promise<void>;
  updateDepartment: (id: string, data: Partial<Department>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  
  addCabinet: (buildingId: string, floorId: string, name: string, departmentId?: string) => Promise<void>;
  updateCabinet: (id: string, data: Partial<Cabinet>) => Promise<void>;
  deleteCabinet: (id: string) => Promise<void>;
  reorderBuildings: (orders: { id: string, order: number }[]) => Promise<void>;
  reorderCabinets: (orders: { id: string, order: number }[]) => Promise<void>;
  
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

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      buildings: [],
      floors: [],
      departments: [],
      cabinets: [],
      equipment: [],
      isLoading: false,
      error: null,
      isLocked: true,

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

          const buildings = buildingsRes.data.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
          const cabinets = cabinetsRes.data.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
          const floors = buildings.flatMap((b: any) => b.floors || []).sort((a: any, b: any) => (a.number || 0) - (b.number || 0));
          
          set({ 
            buildings, 
            floors,
            cabinets,
            departments: departmentsRes.data,
            equipment: equipmentRes.data,
            isLoading: false 
          });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      setIsLocked: (locked: boolean) => {
        set({ isLocked: locked });
      },

      initSocketListeners: () => {
        const checkSocket = setInterval(() => {
          const socket = (window as any).useChatStore?.getState()?.socket;
          if (socket) {
            clearInterval(checkSocket);
            console.log('[Store] LocationStore socket listeners initialized');

            socket.on('registry:building_updated', (building: Building) => {
              console.log('[Socket] Building updated:', building.id);
              set(state => ({
                buildings: state.buildings.map(b => b.id === building.id ? building : b)
              }));
            });

            socket.on('registry:building_created', (building: Building) => {
              console.log('[Socket] Building created:', building.id);
              set(state => ({
                buildings: [...state.buildings, building].sort((a, b) => (a.order || 0) - (b.order || 0))
              }));
            });

            socket.on('registry:building_deleted', ({ id }: { id: string }) => {
              console.log('[Socket] Building deleted:', id);
              set(state => ({
                buildings: state.buildings.filter(b => b.id !== id),
                floors: state.floors.filter(f => f.buildingId !== id),
                cabinets: state.cabinets.filter(c => c.buildingId !== id)
              }));
            });

            socket.on('registry:buildings_reordered', (orders: { id: string, order: number }[]) => {
              console.log('[Socket] Buildings reordered');
              set(state => {
                const newBuildings = state.buildings.map(b => {
                  const update = orders.find(o => o.id === b.id);
                  return update ? { ...b, order: Number(update.order) } : b;
                }).sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
                
                return { buildings: newBuildings };
              });
            });

            socket.on('registry:floor_created', (floor: Floor) => {
              console.log('[Socket] Floor created:', floor.id);
              set(state => ({ floors: [...state.floors, floor].sort((a, b) => (a.number || 0) - (b.number || 0)) }));
            });

            socket.on('registry:floor_updated', (floor: Floor) => {
              console.log('[Socket] Floor updated:', floor.id);
              set(state => ({
                floors: state.floors.map(f => f.id === floor.id ? floor : f).sort((a, b) => (a.number || 0) - (b.number || 0))
              }));
            });

            socket.on('registry:floor_deleted', ({ id }: { id: string }) => {
              console.log('[Socket] Floor deleted:', id);
              set(state => ({
                floors: state.floors.filter(f => f.id !== id),
                cabinets: state.cabinets.filter(c => c.floorId !== id)
              }));
            });

            socket.on('registry:cabinet_created', (cabinet: Cabinet) => {
              console.log('[Socket] Cabinet created:', cabinet.id);
              set(state => ({ 
                cabinets: [...state.cabinets, cabinet].sort((a, b) => (a.order || 0) - (b.order || 0)) 
              }));
            });

            socket.on('registry:cabinet_updated', (cabinet: Cabinet) => {
              console.log('[Socket] Cabinet updated:', cabinet.id);
              set(state => ({
                cabinets: state.cabinets.map(c => c.id === cabinet.id ? cabinet : c)
              }));
            });

            socket.on('registry:cabinet_deleted', ({ id }: { id: string }) => {
              console.log('[Socket] Cabinet deleted:', id);
              set(state => ({
                cabinets: state.cabinets.filter(c => c.id !== id),
                equipment: state.equipment.map(e => e.cabinetId === id ? { ...e, cabinetId: '' } : e)
              }));
            });

            socket.on('registry:cabinets_reordered', (orders: { id: string, order: number }[]) => {
              console.log('[Socket] Cabinets reordered');
              set(state => {
                const newCabinets = state.cabinets.map(c => {
                  const update = orders.find(o => o.id === c.id);
                  return update ? { ...c, order: Number(update.order) } : c;
                }).sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
                
                return { cabinets: newCabinets };
              });
            });

            socket.on('registry:department_created', (dept: Department) => {
              console.log('[Socket] Department created:', dept.id);
              set(state => ({ departments: [...state.departments, dept] }));
            });

            socket.on('registry:department_updated', (dept: Department) => {
              console.log('[Socket] Department updated:', dept.id);
              set(state => ({
                departments: state.departments.map(d => d.id === dept.id ? dept : d)
              }));
            });

            socket.on('registry:department_deleted', ({ id }: { id: string }) => {
              console.log('[Socket] Department deleted:', id);
              set(state => ({
                departments: state.departments.filter(d => d.id !== id),
                cabinets: state.cabinets.map(c => c.departmentId === id ? { ...c, departmentId: undefined } : c)
              }));
            });
          }
        }, 1000);

        return () => {
          const socket = (window as any).useChatStore?.getState()?.socket;
          if (socket) {
            socket.off('registry:building_updated');
            socket.off('registry:building_created');
            socket.off('registry:building_deleted');
            socket.off('registry:buildings_reordered');
            socket.off('registry:floor_created');
            socket.off('registry:floor_updated');
            socket.off('registry:floor_deleted');
            socket.off('registry:cabinet_created');
            socket.off('registry:cabinet_updated');
            socket.off('registry:cabinet_deleted');
            socket.off('registry:cabinets_reordered');
            socket.off('registry:department_created');
            socket.off('registry:department_updated');
            socket.off('registry:department_deleted');
          }
          clearInterval(checkSocket);
        };
      },

      addBuilding: async (name) => {
        try {
          const maxOrder = Math.max(0, ...get().buildings.map(b => b.order || 0));
          const res = await apiClient.post('/registry/buildings', { name, order: maxOrder + 1, width: 350 });
          set(state => ({ buildings: [...state.buildings, res.data].sort((a, b) => (a.order || 0) - (b.order || 0)) }));
        } catch (err: any) {
          set({ error: err.message });
        }
      },

      updateBuilding: async (id, data) => {
        try {
          const res = await apiClient.put(`/registry/buildings/${id}`, data);
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

      updateFloor: async (id, number) => {
        try {
          const res = await apiClient.put(`/registry/floors/${id}`, { number });
          set(state => ({
            floors: state.floors.map(f => f.id === id ? res.data : f)
          }));
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
          const maxOrder = Math.max(0, ...get().cabinets.filter(c => c.floorId === floorId).map(c => c.order || 0));
          const res = await apiClient.post('/registry/cabinets', { buildingId, floorId, name, departmentId, order: maxOrder + 1 });
          set(state => ({ cabinets: [...state.cabinets, res.data].sort((a, b) => (a.order || 0) - (b.order || 0)) }));
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
            equipment: state.equipment.map(e => e.cabinetId === id ? { ...e, cabinetId: '' } : e)
          }));
        } catch (err: any) {
          set({ error: err.message });
        }
      },

      reorderBuildings: async (orders) => {
        try {
          console.log('[Store] Sending building reorder request:', orders);
          await apiClient.put('/registry/buildings/reorder', { orders });
          
          set(state => {
            const newBuildings = state.buildings.map(b => {
              const update = orders.find(o => o.id === b.id);
              return update ? { ...b, order: Number(update.order) } : b;
            }).sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
            
            return { buildings: newBuildings };
          });
        } catch (err: any) {
          console.error('[Store] Building reorder failed:', err);
          set({ error: err.message });
        }
      },

      reorderCabinets: async (orders) => {
        try {
          console.log('[Store] Sending cabinet reorder request:', orders);
          await apiClient.put('/registry/cabinets/reorder', { orders });
          
          set(state => {
            const newCabinets = state.cabinets.map(c => {
              const update = orders.find(o => o.id === c.id);
              return update ? { ...c, order: Number(update.order) } : c;
            }).sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
            
            return { cabinets: newCabinets };
          });
        } catch (err: any) {
          console.error('[Store] Cabinet reorder failed:', err);
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
    }),
    {
      name: 'location-storage',
      partialize: (state: LocationState) => ({ isLocked: state.isLocked }),
    }
  )
);
