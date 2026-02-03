import { useState, useCallback, useMemo } from 'react';
import type { Document, DocumentType, DocumentStatus } from '@/types';
import { mockDocuments } from '@/data/mockDocuments';
import { currentUser } from '@/data/mock';

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [filter, setFilter] = useState<{ type?: DocumentType; status?: DocumentStatus; search?: string }>({});

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (filter.type && doc.type !== filter.type) return false;
      if (filter.status && doc.status !== filter.status) return false;
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const matchesSearch = 
          doc.number.toLowerCase().includes(searchLower) ||
          doc.title.toLowerCase().includes(searchLower) ||
          doc.equipmentName?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [documents, filter]);

  const documentsByType = useMemo(() => {
    return {
      all: filteredDocuments,
      act: filteredDocuments.filter(d => d.type === 'act'),
      repair: filteredDocuments.filter(d => d.type === 'repair'),
      maintenance: filteredDocuments.filter(d => d.type === 'maintenance'),
      inventory: filteredDocuments.filter(d => d.type === 'inventory'),
    };
  }, [filteredDocuments]);

  const getDocumentById = useCallback((id: string) => {
    return documents.find(d => d.id === id);
  }, [documents]);

  const createDocument = useCallback((data: {
    title: string;
    type: DocumentType;
    description: string;
    equipmentName?: string;
    equipmentLocation?: string;
    repairDate?: string;
    repairCost?: number;
    partsUsed?: string[];
  }) => {
    const newDoc: Document = {
      id: Date.now().toString(),
      number: `ДОК-${2025}-${String(documents.length + 1).padStart(3, '0')}`,
      title: data.title,
      type: data.type,
      status: 'active',
      description: data.description,
      equipmentName: data.equipmentName,
      equipmentLocation: data.equipmentLocation,
      repairDate: data.repairDate,
      repairCost: data.repairCost || 0,
      partsUsed: data.partsUsed || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: currentUser,
    };
    setDocuments(prev => [newDoc, ...prev]);
    return newDoc;
  }, [documents.length]);

  const updateDocumentStatus = useCallback((docId: string, status: DocumentStatus) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id === docId) {
        return { ...doc, status, updatedAt: new Date().toISOString() };
      }
      return doc;
    }));
  }, []);

  return {
    documents: filteredDocuments,
    documentsByType,
    filter,
    setFilter,
    getDocumentById,
    createDocument,
    updateDocumentStatus,
  };
}
