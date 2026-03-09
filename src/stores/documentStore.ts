import { create } from 'zustand';
import type { Document, DocumentFilter } from '@/types';
import { documentService } from '@/api/documents';

interface DocumentStore {
  documents: Document[];
  filter: DocumentFilter;
  setFilter: (filter: Partial<DocumentFilter>) => void;
  createDocument: (doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) => Document;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
}

export const useDocumentStore = create<DocumentStore>((set) => ({
  documents: documentService.getAll(),
  filter: {},
  
  setFilter: (newFilter) => set((state) => ({ 
    filter: { ...state.filter, ...newFilter } 
  })),
  
  createDocument: (docData) => {
    const newDoc = documentService.create(docData);
    set((state) => {
      // Check if document with this ID already exists to prevent duplicates from React StrictMode
      if (state.documents.some(d => d.id === newDoc.id)) {
        return state;
      }
      return {
        documents: [newDoc, ...state.documents]
      };
    });
    return newDoc;
  },

  updateDocument: (id, updates) => {
    documentService.update(id, updates);
    set((state) => ({
      documents: state.documents.map((d) => 
        d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
      ),
    }));
  },
  
  deleteDocument: (id) => {
    documentService.delete(id);
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
    }));
  },
}));
