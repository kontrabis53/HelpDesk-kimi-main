import { create } from 'zustand';
import type { Ticket, TicketStatus, TicketFilter, TicketPriority, TicketCategory } from '@/types';
import { mockTickets, currentUser, users } from '@/data/mock';

interface TicketStats {
  total: number;
  new: number;
  in_progress: number;
  resolved: number;
  my_tickets: number;
}

interface TicketStore {
  // State
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  filter: TicketFilter;
  
  // Computed
  filteredTickets: () => Ticket[];
  ticketsByStatus: () => {
    all: Ticket[];
    new: Ticket[];
    in_progress: Ticket[];
    waiting: Ticket[];
    resolved: Ticket[];
  };
  stats: () => TicketStats;
  
  // Actions
  setTickets: (tickets: Ticket[]) => void;
  setSelectedTicket: (ticket: Ticket | null) => void;
  setFilter: (filter: TicketFilter) => void;
  getTicketById: (id: string) => Ticket | undefined;
  createTicket: (data: {
    title: string;
    description: string;
    category: TicketCategory;
    priority: TicketPriority;
  }) => Ticket;
  updateTicket: (ticketId: string, data: {
    title: string;
    description: string;
    category: TicketCategory;
    priority: TicketPriority;
  }) => void;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => void;
  assignTicket: (ticketId: string, assigneeId: string) => void;
  deleteTicket: (ticketId: string) => void;
  addComment: (ticketId: string, text: string) => void;
  getAvailableAssignees: () => typeof users;
}

export const useTicketStore = create<TicketStore>((set, get) => ({
  // Initial state
  tickets: mockTickets,
  selectedTicket: null,
  filter: {},
  
  // Computed selectors
  filteredTickets: () => {
    const { tickets, filter } = get();
    return tickets.filter((ticket) => {
      if (filter.status && ticket.status !== filter.status) return false;
      if (filter.priority && ticket.priority !== filter.priority) return false;
      if (filter.category && ticket.category !== filter.category) return false;
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const matchesSearch = 
          ticket.number.toLowerCase().includes(searchLower) ||
          ticket.title.toLowerCase().includes(searchLower) ||
          ticket.description.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  
  ticketsByStatus: () => {
    const filtered = get().filteredTickets();
    return {
      all: filtered,
      new: filtered.filter(t => t.status === 'new'),
      in_progress: filtered.filter(t => t.status === 'in_progress'),
      waiting: filtered.filter(t => t.status === 'waiting'),
      resolved: filtered.filter(t => t.status === 'resolved'),
    };
  },
  
  stats: () => {
    const { tickets } = get();
    return {
      total: tickets.length,
      new: tickets.filter(t => t.status === 'new').length,
      in_progress: tickets.filter(t => t.status === 'in_progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      my_tickets: tickets.filter(t => t.author.id === currentUser.id).length,
    };
  },
  
  // Actions
  setTickets: (tickets) => set({ tickets }),
  
  setSelectedTicket: (ticket) => set({ selectedTicket: ticket }),
  
  setFilter: (filter) => set({ filter }),
  
  getTicketById: (id) => {
    return get().tickets.find(t => t.id === id);
  },
  
  createTicket: (data) => {
    const { tickets } = get();
    const newTicket: Ticket = {
      id: Date.now().toString(),
      number: `#${1000 + tickets.length + 1}`,
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority,
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: currentUser,
      comments: [],
    };
    set({ tickets: [newTicket, ...tickets] });
    return newTicket;
  },
  
  updateTicket: (ticketId, data) => {
    set((state) => ({
      tickets: state.tickets.map((ticket) => {
        if (ticket.id === ticketId) {
          return {
            ...ticket,
            ...data,
            updatedAt: new Date().toISOString(),
          };
        }
        return ticket;
      }),
    }));
    
    // Update selected ticket if it's the one being updated
    const { selectedTicket } = get();
    if (selectedTicket?.id === ticketId) {
      const updated = get().getTicketById(ticketId);
      if (updated) set({ selectedTicket: updated });
    }
  },
  
  updateTicketStatus: (ticketId, status) => {
    set((state) => ({
      tickets: state.tickets.map((ticket) => {
        if (ticket.id === ticketId) {
          return {
            ...ticket,
            status,
            updatedAt: new Date().toISOString(),
          };
        }
        return ticket;
      }),
    }));
    
    // Update selected ticket if it's the one being updated
    const { selectedTicket } = get();
    if (selectedTicket?.id === ticketId) {
      const updated = get().getTicketById(ticketId);
      if (updated) set({ selectedTicket: updated });
    }
  },
  
  assignTicket: (ticketId, assigneeId) => {
    set((state) => ({
      tickets: state.tickets.map((ticket) => {
        if (ticket.id === ticketId) {
          if (!assigneeId) {
            // Remove assignee
            const { assignee: _, ...rest } = ticket;
            return {
              ...rest,
              updatedAt: new Date().toISOString(),
            };
          }
          // Assign new assignee
          const assignee = users.find(u => u.id === assigneeId);
          return {
            ...ticket,
            assignee,
            updatedAt: new Date().toISOString(),
          };
        }
        return ticket;
      }),
    }));
    
    // Update selected ticket if it's the one being updated
    const { selectedTicket } = get();
    if (selectedTicket?.id === ticketId) {
      const updated = get().getTicketById(ticketId);
      if (updated) set({ selectedTicket: updated });
    }
  },
  
  deleteTicket: (ticketId) => {
    set((state) => ({
      tickets: state.tickets.filter(t => t.id !== ticketId),
    }));
    
    // Clear selected ticket if it's the one being deleted
    const { selectedTicket } = get();
    if (selectedTicket?.id === ticketId) {
      set({ selectedTicket: null });
    }
  },
  
  addComment: (ticketId, text) => {
    set((state) => ({
      tickets: state.tickets.map((ticket) => {
        if (ticket.id === ticketId) {
          return {
            ...ticket,
            comments: [
              ...ticket.comments,
              {
                id: Date.now().toString(),
                author: currentUser,
                text,
                createdAt: new Date().toISOString(),
              },
            ],
            updatedAt: new Date().toISOString(),
          };
        }
        return ticket;
      }),
    }));
    
    // Update selected ticket if it's the one being updated
    const { selectedTicket } = get();
    if (selectedTicket?.id === ticketId) {
      const updated = get().getTicketById(ticketId);
      if (updated) set({ selectedTicket: updated });
    }
  },
  
  getAvailableAssignees: () => {
    return users.filter(u => u.role === 'technician' || u.role === 'admin');
  },
}));
