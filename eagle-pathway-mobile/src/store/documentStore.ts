import { create } from 'zustand';
import { scholarshipsService } from '../services/scholarships';
import { Document, DocumentType } from '../types';

interface DocumentState {
  documents: Document[];
  isLoadingDocuments: boolean;

  // Actions
  loadDocuments: (userId: string) => Promise<void>;
  uploadDocument: (params: {
    userId: string;
    applicationId?: string;
    documentType: DocumentType;
    fileUri: string;
    fileName: string;
  }) => Promise<Document>;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  isLoadingDocuments: false,

  loadDocuments: async (userId) => {
    set({ isLoadingDocuments: true });
    try {
      const documents = await scholarshipsService.getUserDocuments(userId);
      set({ documents });
    } finally {
      set({ isLoadingDocuments: false });
    }
  },

  uploadDocument: async (params) => {
    set({ isLoadingDocuments: true });
    try {
      const doc = await scholarshipsService.uploadDocument(params);
      set(state => ({ documents: [doc, ...state.documents] }));
      return doc;
    } finally {
      set({ isLoadingDocuments: false });
    }
  },
}));
