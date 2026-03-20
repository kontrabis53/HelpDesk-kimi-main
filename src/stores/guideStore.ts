import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TechnicalGuide } from '@/types';

interface GuideState {
  guides: TechnicalGuide[];
  
  // Actions
  addGuide: (guide: Omit<TechnicalGuide, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateGuide: (id: string, updates: Partial<TechnicalGuide>) => void;
  deleteGuide: (id: string) => void;
  
  // Selectors
  getGuideById: (id: string) => TechnicalGuide | undefined;
  getGuidesByEquipment: (modelName: string) => TechnicalGuide[];
}

export const useGuideStore = create<GuideState>()(
  persist(
    (set, get) => ({
      guides: [
        {
          id: 'tg-hamilton-c3',
          title: 'Инструкция к ИВЛ Hamilton C3',
          description: 'Полное руководство пользователя и сервисный мануал для аппарата ИВЛ Hamilton C3.',
          equipmentModels: ['Hamilton C3', 'Hamilton'],
          fileUrls: [
            { name: 'Hamilton_C3_User_Manual.pdf', url: '#', type: 'pdf' },
            { name: 'Service_Guide_C3.pdf', url: '#', type: 'pdf' }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],

      addGuide: (guideData) => set(state => ({
        guides: [
          ...state.guides, 
          { 
            ...guideData, 
            id: `tg-${Date.now()}`, 
            createdAt: new Date().toISOString(), 
            updatedAt: new Date().toISOString() 
          }
        ]
      })),

      updateGuide: (id, updates) => set(state => ({
        guides: state.guides.map(g => 
          g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g
        )
      })),

      deleteGuide: (id) => set(state => ({
        guides: state.guides.filter(g => g.id !== id)
      })),

      getGuideById: (id) => get().guides.find(g => g.id === id),
      
      getGuidesByEquipment: (modelName) => {
        if (!modelName) return [];
        const search = modelName.toLowerCase();
        return get().guides.filter(g => 
          g.equipmentModels.some(m => search.includes(m.toLowerCase()) || m.toLowerCase().includes(search)) ||
          g.title.toLowerCase().includes(search)
        );
      }
    }),
    {
      name: 'technical-guides-storage'
    }
  )
);
