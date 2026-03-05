import { describe, it, expect } from 'vitest';
import { ticketSchema } from './schemas';

describe('Validation Schemas', () => {
  describe('ticketSchema', () => {
    it('should validate a valid ticket', () => {
      const validTicket = {
        title: 'Valid Ticket',
        description: 'This is a valid description with enough characters',
        category: 'hardware',
        priority: 'medium',
        assigneeId: '',
      };
      
      const result = ticketSchema.safeParse(validTicket);
      expect(result.success).toBe(true);
    });

    it('should fail if title is too short', () => {
      const invalidTicket = {
        title: 'No',
        description: 'Valid description',
        category: 'hardware',
        priority: 'medium',
      };
      
      const result = ticketSchema.safeParse(invalidTicket);
      expect(result.success).toBe(false);
    });

    it('should fail if description is too short', () => {
      const invalidTicket = {
        title: 'Valid Title',
        description: 'Short',
        category: 'hardware',
        priority: 'medium',
      };
      
      const result = ticketSchema.safeParse(invalidTicket);
      expect(result.success).toBe(false);
    });
  });
});
