import { create } from 'zustand';
import type { Ticket, TicketFilter, TicketStatus, TicketPriority } from '@/types';
import { ticketService } from '@/api/tickets';

interface TicketStore {
  tickets: Ticket[];
  filter: TicketFilter;
  selectedTicket: Ticket | null;
  isLoading: boolean;
  
  fetchTickets: () => Promise<void>;
  setFilter: (filter: Partial<TicketFilter>) => void;
  setSelectedTicket: (ticket: Ticket | null) => void;
  getTicketById: (id: string) => Promise<Ticket | null>;
  createTicket: (ticket: any) => Promise<Ticket>;
  updateTicket: (id: string, updates: Partial<Ticket> & { assigneeId?: string | null }) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  updateTicketStatus: (id: string, status: TicketStatus) => Promise<void>;
  updateTicketPriority: (id: string, priority: TicketPriority) => Promise<void>;
  addComment: (ticketId: string, text: string) => Promise<void>;
  
  stats: () => {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
  };
}

export const useTicketStore = create<TicketStore>((set, get) => ({
  tickets: [],
  filter: {},
  selectedTicket: null,
  isLoading: false,
  
  fetchTickets: async () => {
    set({ isLoading: true });
    try {
      const tickets = await ticketService.getAll();
      set({ tickets: tickets || [], isLoading: false });
    } catch (error: any) {
      console.error('Fetch tickets error:', error);
      set({ isLoading: false });
    }
  },

  setFilter: (newFilter) => set((state) => ({ 
    filter: { ...state.filter, ...newFilter } 
  })),
  
  stats: () => {
    const { tickets } = get();
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'new' || t.status === 'waiting').length,
      inProgress: tickets.filter(t => t.status === 'in_progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
    };
  },
  
  setSelectedTicket: (ticket) => set({ selectedTicket: ticket }),
  
  getTicketById: async (id) => {
    try {
      const ticket = await ticketService.getById(id);
      return ticket;
    } catch (error: any) {
      console.error('Get ticket error:', error);
      return null;
    }
  },
  
  createTicket: async (ticketData) => {
    set({ isLoading: true });
    try {
      const newTicket = await ticketService.create(ticketData);
      set((state) => ({
        tickets: [newTicket, ...state.tickets],
        isLoading: false
      }));
      return newTicket;
    } catch (error) {
      console.error('Create ticket error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  updateTicket: async (id, updates) => {
    set({ isLoading: true });
    try {
      const updatedTicket = await ticketService.update(id, updates);
      set((state) => ({
        tickets: state.tickets.map((t) => t.id === id ? updatedTicket : t),
        selectedTicket: state.selectedTicket?.id === id ? updatedTicket : state.selectedTicket,
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Update ticket error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  deleteTicket: async (id) => {
    set({ isLoading: true });
    try {
      await ticketService.delete(id);
      set((state) => ({
        tickets: state.tickets.filter((t) => t.id !== id),
        selectedTicket: state.selectedTicket?.id === id ? null : state.selectedTicket,
        isLoading: false
      }));
    } catch (error) {
      console.error('Delete ticket error:', error);
      set({ isLoading: false });
      throw error;
    }
  },
  
  updateTicketStatus: async (id, status) => {
    try {
      const updatedTicket = await ticketService.update(id, { status });
      set((state) => ({
        tickets: state.tickets.map((t) => t.id === id ? updatedTicket : t),
        selectedTicket: state.selectedTicket?.id === id ? updatedTicket : state.selectedTicket
      }));
    } catch (error) {
      console.error('Update status error:', error);
      throw error;
    }
  },
  
  updateTicketPriority: async (id, priority) => {
    try {
      const updatedTicket = await ticketService.update(id, { priority });
      set((state) => ({
        tickets: state.tickets.map((t) => t.id === id ? updatedTicket : t),
        selectedTicket: state.selectedTicket?.id === id ? updatedTicket : state.selectedTicket
      }));
    } catch (error) {
      console.error('Update priority error:', error);
      throw error;
    }
  },

  addComment: async (ticketId, text) => {
    try {
      const comment = await ticketService.addComment(ticketId, text);
      set((state) => {
        const tickets = state.tickets.map(t => {
          if (t.id === ticketId) {
            return { ...t, comments: [...(t.comments || []), comment] };
          }
          return t;
        });
        
        let selectedTicket = state.selectedTicket;
        if (selectedTicket?.id === ticketId) {
          selectedTicket = { 
            ...selectedTicket, 
            comments: [...(selectedTicket.comments || []), comment] 
          };
        }
        
        return { tickets, selectedTicket };
      });
    } catch (error) {
      console.error('Add comment error:', error);
      throw error;
    }
  }
}));
