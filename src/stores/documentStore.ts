import { create } from 'zustand';
import type { Document, DocumentFilter } from '@/types';
import { documentService } from '@/api/documents';

interface DocumentStore {
  documents: Document[];
  filter: DocumentFilter;
  viewType: 'list' | 'calendar' | 'grid' | 'day';
  currentDate: Date;
  isLoading: boolean;
  
  fetchDocuments: () => Promise<void>;
  setFilter: (filter: Partial<DocumentFilter>) => void;
  setViewType: (viewType: 'list' | 'calendar' | 'grid' | 'day') => void;
  setCurrentDate: (date: Date) => void;
  createDocument: (doc: any) => Promise<Document>;
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>;
  archiveDocument: (id: string) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
}

const getInitialViewType = (): 'list' | 'calendar' | 'grid' | 'day' => {
  const saved = localStorage.getItem('documentsViewType');
  if (saved === 'list' || saved === 'calendar' || saved === 'grid' || saved === 'day') {
    return saved;
  }
  return 'calendar';
};

export const useDocumentStore = create<DocumentStore>((set) => ({
  documents: [],
  filter: {},
  viewType: getInitialViewType(),
  currentDate: new Date(),
  isLoading: false,
  
  setViewType: (viewType) => {
    localStorage.setItem('documentsViewType', viewType);
    
    // Update switch counts to determine preferred default
    if (viewType !== 'day') {
      const countsJson = localStorage.getItem('documentsViewTypeCounts');
      const counts = countsJson ? JSON.parse(countsJson) : { list: 0, calendar: 0, grid: 0 };
      counts[viewType] = (counts[viewType] || 0) + 1;
      
      // If user switches to this type 3 or more times, make it the permanent default
      if (counts[viewType] >= 3) {
        localStorage.setItem('documentsViewType', viewType);
      }
      
      localStorage.setItem('documentsViewTypeCounts', JSON.stringify(counts));
    }
    
    set({ viewType });
  },
  
  setCurrentDate: (date) => set((state) => {
    // Only update if the date has actually changed (comparing timestamps)
    if (state.currentDate.getTime() === date.getTime()) return state;
    return { currentDate: date };
  }),
  
  fetchDocuments: async () => {
    set({ isLoading: true });
    try {
      const documents = await documentService.getAll();
      set({ documents, isLoading: false });
    } catch (error: any) {
      console.error('Fetch documents error:', error);
      set({ isLoading: false });
    }
  },

  setFilter: (newFilter) => set((state) => ({ 
    filter: { ...state.filter, ...newFilter } 
  })),
  
  createDocument: async (docData) => {
    set({ isLoading: true });
    try {
      const newDoc = await documentService.create(docData);
      set((state) => ({
        documents: [newDoc, ...state.documents],
        isLoading: false
      }));
      return newDoc;
    } catch (error) {
      console.error('Create document error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  updateDocument: async (id, updates) => {
    set({ isLoading: true });
    try {
      const updated = await documentService.update(id, updates);
      set((state) => ({
        documents: state.documents.map((d) => d.id === id ? updated : d),
        isLoading: false
      }));
    } catch (error) {
      console.error('Update document error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  archiveDocument: async (id) => {
    set({ isLoading: true });
    try {
      const updated = await documentService.archive(id);
      set((state) => ({
        documents: state.documents.map((d) => d.id === id ? updated : d),
        isLoading: false
      }));
    } catch (error) {
      console.error('Archive document error:', error);
      set({ isLoading: false });
      throw error;
    }
  },
  
  deleteDocument: async (id) => {
    set({ isLoading: true });
    try {
      await documentService.delete(id);
      set((state) => ({
        documents: state.documents.filter((d) => d.id !== id),
        isLoading: false
      }));
    } catch (error) {
      console.error('Delete document error:', error);
      set({ isLoading: false });
      throw error;
    }
  },
}));
