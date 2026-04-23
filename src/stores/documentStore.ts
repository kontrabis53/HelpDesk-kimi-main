import { create } from 'zustand';
import type { Document, DocumentFilter } from '@/types';
import { documentService } from '@/api/documents';

interface DocumentStore {
  documents: Document[];
  filter: DocumentFilter;
  isLoading: boolean;
  
  fetchDocuments: () => Promise<void>;
  setFilter: (filter: Partial<DocumentFilter>) => void;
  createDocument: (doc: any) => Promise<Document>;
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>;
  archiveDocument: (id: string) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  filter: {},
  isLoading: false,
  
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
    const newDoc = await documentService.create(docData);
    set((state) => ({
      documents: [newDoc, ...state.documents]
    }));
    return newDoc;
  },

  updateDocument: async (id, updates) => {
    const updated = await documentService.update(id, updates);
    set((state) => ({
      documents: state.documents.map((d) => d.id === id ? updated : d),
    }));
  },

  archiveDocument: async (id) => {
    const updated = await documentService.archive(id);
    set((state) => ({
      documents: state.documents.map((d) => d.id === id ? updated : d),
    }));
  },
  
  deleteDocument: async (id) => {
    await documentService.delete(id);
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
    }));
  },
}));
