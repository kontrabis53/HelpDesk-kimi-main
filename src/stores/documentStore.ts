import { create } from 'zustand';
import type { Document, DocumentType, DocumentStatus } from '@/types';
import { mockDocuments } from '@/data/mockDocuments';
import { currentUser } from '@/data/mock';

interface DocumentFilter {
  type?: DocumentType;
  status?: DocumentStatus;
  search?: string;
}

interface DocumentStore {
  // State
  documents: Document[];
  filter: DocumentFilter;
  
  // Computed
  filteredDocuments: () => Document[];
  documentsByType: () => {
    all: Document[];
    act: Document[];
    repair: Document[];
    maintenance: Document[];
    inventory: Document[];
    other: Document[];
  };
  
  // Actions
  setDocuments: (documents: Document[]) => void;
  setFilter: (filter: DocumentFilter) => void;
  getDocumentById: (id: string) => Document | undefined;
  createDocument: (data: {
    title: string;
    type: DocumentType;
    status: DocumentStatus;
    description: string;
    equipmentName?: string;
    equipmentLocation?: string;
    repairDate?: string;
    repairCost?: number;
    partsUsed?: string[];
  }) => Document;
  updateDocument: (documentId: string, data: Partial<Document>) => void;
  deleteDocument: (documentId: string) => void;
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  // Initial state
  documents: mockDocuments,
  filter: {},
  
  // Computed selectors
  filteredDocuments: () => {
    const { documents, filter } = get();
    return documents.filter((doc) => {
      if (filter.type && doc.type !== filter.type) return false;
      if (filter.status && doc.status !== filter.status) return false;
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const matchesSearch =
          doc.number.toLowerCase().includes(searchLower) ||
          doc.title.toLowerCase().includes(searchLower) ||
          doc.description.toLowerCase().includes(searchLower) ||
          doc.equipmentName?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  
  documentsByType: () => {
    const filtered = get().filteredDocuments();
    return {
      all: filtered,
      act: filtered.filter(d => d.type === 'act'),
      repair: filtered.filter(d => d.type === 'repair'),
      maintenance: filtered.filter(d => d.type === 'maintenance'),
      inventory: filtered.filter(d => d.type === 'inventory'),
      other: filtered.filter(d => d.type === 'other'),
    };
  },
  
  // Actions
  setDocuments: (documents) => set({ documents }),
  
  setFilter: (filter) => set({ filter }),
  
  getDocumentById: (id) => {
    return get().documents.find(d => d.id === id);
  },
  
  createDocument: (data) => {
    const { documents } = get();
    const newDocument: Document = {
      id: Date.now().toString(),
      number: `DOC-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: currentUser,
    };
    set({ documents: [newDocument, ...documents] });
    return newDocument;
  },
  
  updateDocument: (documentId, data) => {
    set((state) => ({
      documents: state.documents.map((doc) => {
        if (doc.id === documentId) {
          return {
            ...doc,
            ...data,
            updatedAt: new Date().toISOString(),
          };
        }
        return doc;
      }),
    }));
  },
  
  deleteDocument: (documentId) => {
    set((state) => ({
      documents: state.documents.filter(d => d.id !== documentId),
    }));
  },
}));
