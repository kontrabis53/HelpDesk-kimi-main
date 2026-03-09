import { mockDocuments } from '@/data/mockDocuments';
import type { Document } from '@/types';

// In a real application, this would be an API client making HTTP requests
export const documentService = {
  getAll: (): Document[] => {
    return mockDocuments;
  },

  create: (doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Document => {
    const newDoc = {
      ...doc,
      id: Date.now().toString(),
      number: doc.number || `ДОК-${new Date().getFullYear()}-${String(mockDocuments.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Document;
    
    mockDocuments.push(newDoc);
    return newDoc;
  },

  update: (id: string, updates: Partial<Document>): Document | undefined => {
    const index = mockDocuments.findIndex(d => d.id === id);
    if (index === -1) return undefined;
    
    mockDocuments[index] = { ...mockDocuments[index], ...updates };
    return mockDocuments[index];
  },
  
  delete: (id: string): void => {
    const index = mockDocuments.findIndex(d => d.id === id);
    if (index !== -1) {
      mockDocuments.splice(index, 1);
    }
  }
};
