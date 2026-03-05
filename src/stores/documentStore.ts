import { create } from 'zustand';
import type { Document, DocumentFilter } from '@/types';
import { documentService } from '@/api/documents';

interface DocumentStore {
  documents: Document[];
  filter: DocumentFilter;
  setFilter: (filter: Partial<DocumentFilter>) => void;
  createDocument: (doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) => void;
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
    set((state) => ({
      documents: [...state.documents, newDoc]
    }));
  },
  
  deleteDocument: (id) => {
    documentService.delete(id);
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
    }));
  },
}));
