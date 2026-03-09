import { create } from 'zustand';
import type { Ticket, TicketFilter, TicketStatus, TicketPriority, User } from '@/types';
import { ticketService } from '@/api/tickets';
import { userService } from '@/api/users';

interface TicketStore {
  tickets: Ticket[];
  filter: TicketFilter;
  selectedTicket: Ticket | null;
  setFilter: (filter: Partial<TicketFilter>) => void;
  setSelectedTicket: (ticket: Ticket | null) => void;
  getTicketById: (id: string) => Ticket | undefined;
  createTicket: (ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'number' | 'comments'>) => Ticket;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  deleteTicket: (id: string) => void;
  updateTicketStatus: (id: string, status: TicketStatus) => void;
  updateTicketPriority: (id: string, priority: TicketPriority) => void;
  addComment: (ticketId: string, text: string) => void;
  assignTicket: (ticketId: string, userId: string) => void;
  getAvailableAssignees: () => User[];
  stats: () => {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
  };
}

export const useTicketStore = create<TicketStore>((set, get) => ({
  tickets: ticketService.getAll(),
  filter: {},
  selectedTicket: null,
  
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
  
  getTicketById: (id) => {
    return ticketService.getById(id);
  },
  
  createTicket: (ticketData) => {
    const newTicket = ticketService.create({
      ...ticketData,
      comments: [],
    });
    set((state) => {
      if (state.tickets.some(t => t.id === newTicket.id)) {
        return state;
      }
      return {
        tickets: [newTicket, ...state.tickets]
      };
    });
    return newTicket;
  },

  updateTicket: (id, updates) => {
    ticketService.update(id, { ...updates, updatedAt: new Date().toISOString() });
    set((state) => ({
      tickets: state.tickets.map((t) => 
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      ),
    }));
  },

  deleteTicket: (id) => {
    ticketService.delete(id);
    set((state) => ({
      tickets: state.tickets.filter((t) => t.id !== id),
    }));
  },
  
  updateTicketStatus: (id, status) => {
    ticketService.update(id, { status, updatedAt: new Date().toISOString() });
    set((state) => ({
      tickets: state.tickets.map((t) => 
        t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t
      ),
    }));
  },
  
  updateTicketPriority: (id, priority) => {
    ticketService.update(id, { priority, updatedAt: new Date().toISOString() });
    set((state) => ({
      tickets: state.tickets.map((t) => 
        t.id === id ? { ...t, priority, updatedAt: new Date().toISOString() } : t
      ),
    }));
  },
  
  addComment: (ticketId, text) => {
    const ticket = get().getTicketById(ticketId);
    if (!ticket) return;

    // Use current user from roleStore
    const currentUser = useRoleStore.getState().currentUser();
    
    if (!currentUser) return;

    const newComment = {
      id: Date.now().toString(),
      text,
      author: currentUser,
      createdAt: new Date().toISOString(),
    };

    const updatedComments = [...(ticket.comments || []), newComment];
    ticketService.update(ticketId, { comments: updatedComments });

    set((state) => ({
      tickets: state.tickets.map((t) => 
        t.id === ticketId ? { ...t, comments: updatedComments } : t
      ),
    }));
    
    // Update selected ticket if it's the one being modified
    const { selectedTicket } = get();
    if (selectedTicket?.id === ticketId) {
      set({ selectedTicket: { ...selectedTicket, comments: updatedComments } });
    }
  },
  
  assignTicket: (ticketId, userId) => {
    const assignee = userService.getById(userId);
    if (!assignee) return;

    const updatedTicket = ticketService.assign(ticketId, assignee);
    if (updatedTicket) {
      set((state) => ({
        tickets: state.tickets.map((t) => 
          t.id === ticketId ? updatedTicket : t
        ),
      }));
      
      const { selectedTicket } = get();
      if (selectedTicket?.id === ticketId) {
        set({ selectedTicket: updatedTicket });
      }
    }
  },
  
  getAvailableAssignees: () => {
    // Return users with roles 'technician' or 'admin'
    return userService.getByRole('technician').concat(userService.getByRole('admin'));
  },
}));
