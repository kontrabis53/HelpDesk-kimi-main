import { mockTickets } from '@/data/mock';
import type { Ticket, User } from '@/types';

// In a real application, this would be an API client making HTTP requests
export const ticketService = {
  getAll: (): Ticket[] => {
    return mockTickets;
  },

  getById: (id: string): Ticket | undefined => {
    return mockTickets.find(ticket => ticket.id === id);
  },

  create: (ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'number'>): Ticket => {
    const newTicket: Ticket = {
      ...ticket,
      id: Date.now().toString(),
      number: `#${1000 + mockTickets.length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // Simulate DB update
    mockTickets.push(newTicket);
    return newTicket;
  },

  update: (id: string, updates: Partial<Ticket>): Ticket | undefined => {
    const index = mockTickets.findIndex(t => t.id === id);
    if (index === -1) return undefined;
    
    mockTickets[index] = { ...mockTickets[index], ...updates };
    return mockTickets[index];
  },

  assign: (ticketId: string, assignee: User): Ticket | undefined => {
    const ticket = mockTickets.find(t => t.id === ticketId);
    
    if (!ticket) return undefined;
    
    ticket.assignee = assignee;
    ticket.status = 'in_progress';
    ticket.updatedAt = new Date().toISOString();
    
    return ticket;
  },

  delete: (id: string): void => {
    const index = mockTickets.findIndex(t => t.id === id);
    if (index !== -1) {
      mockTickets.splice(index, 1);
    }
  }
};
