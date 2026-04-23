import { create } from 'zustand';
import type { Ticket, TicketFilter, TicketStatus, TicketPriority, User } from '@/types';
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
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>;
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
    const { filter } = get();
    set({ isLoading: true });
    try {
      const tickets = await ticketService.getAll();
      set({ tickets, isLoading: false });
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
    const newTicket = await ticketService.create(ticketData);
    set((state) => ({
      tickets: [newTicket, ...state.tickets]
    }));
    return newTicket;
  },

  updateTicket: async (id, updates) => {
    const updatedTicket = await ticketService.update(id, updates);
    set((state) => ({
      tickets: state.tickets.map((t) => t.id === id ? updatedTicket : t),
      selectedTicket: state.selectedTicket?.id === id ? updatedTicket : state.selectedTicket
    }));
  },

  deleteTicket: async (id) => {
    await ticketService.delete(id);
    set((state) => ({
      tickets: state.tickets.filter((t) => t.id !== id),
      selectedTicket: state.selectedTicket?.id === id ? null : state.selectedTicket
    }));
  },
  
  updateTicketStatus: async (id, status) => {
    const updatedTicket = await ticketService.update(id, { status });
    set((state) => ({
      tickets: state.tickets.map((t) => t.id === id ? updatedTicket : t),
      selectedTicket: state.selectedTicket?.id === id ? updatedTicket : state.selectedTicket
    }));
  },
  
  updateTicketPriority: async (id, priority) => {
    const updatedTicket = await ticketService.update(id, { priority });
    set((state) => ({
      tickets: state.tickets.map((t) => t.id === id ? updatedTicket : t),
      selectedTicket: state.selectedTicket?.id === id ? updatedTicket : state.selectedTicket
    }));
  },

  addComment: async (ticketId, text) => {
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
  }
}));
