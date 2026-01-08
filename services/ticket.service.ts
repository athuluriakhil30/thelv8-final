import { supabase } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/server';
import { Insertable, Updateable, handleSupabaseResponse } from '@/lib/supabase/types';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'general' | 'order' | 'product' | 'account' | 'payment' | 'shipping' | 'other';

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  chat_context?: any;
  admin_notes?: string | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketWithUser extends SupportTicket {
  user: {
    email: string;
    full_name?: string;
  };
}

export interface CreateTicketData {
  userId: string;
  subject: string;
  description: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  chatContext?: any;
}

export const ticketService = {
  /**
   * Create a new support ticket
   */
  async createTicket(data: CreateTicketData): Promise<SupportTicket> {
    try {
      const ticketData: any = {
        user_id: data.userId,
        subject: data.subject,
        description: data.description,
        category: data.category || 'general',
        priority: data.priority || 'medium',
        status: 'open',
        chat_context: data.chatContext || null,
      };

      const { data: ticket, error } = await (supabaseAdmin as any)
        .from('support_tickets')
        .insert(ticketData)
        .select()
        .single();

      if (error) {
        console.error('[TicketService] Error creating ticket:', error);
        throw error;
      }

      return ticket as SupportTicket;
    } catch (error) {
      console.error('[TicketService] createTicket failed:', error);
      throw error;
    }
  },

  /**
   * Get all tickets for a user
   */
  async getUserTickets(userId: string): Promise<SupportTicket[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('support_tickets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[TicketService] Error fetching user tickets:', error);
        throw error;
      }

      return (data as SupportTicket[]) || [];
    } catch (error) {
      console.error('[TicketService] getUserTickets failed:', error);
      throw error;
    }
  },

  /**
   * Get a single ticket by ID
   */
  async getTicketById(ticketId: string): Promise<SupportTicket | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('[TicketService] Error fetching ticket:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[TicketService] getTicketById failed:', error);
      throw error;
    }
  },

  /**
   * Get all tickets (admin only - uses service role)
   */
  async getAllTickets(): Promise<TicketWithUser[]> {
    try {
      // First get all tickets
      const { data: tickets, error: ticketsError } = await (supabaseAdmin as any)
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (ticketsError) {
        console.error('[TicketService] Error fetching all tickets:', ticketsError);
        throw ticketsError;
      }

      if (!tickets || tickets.length === 0) {
        return [];
      }

      // Get unique user IDs
      const userIds = Array.from(new Set(tickets.map((t: any) => t.user_id)));

      // Fetch user profiles
      const { data: profiles, error: profilesError } = await (supabaseAdmin as any)
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      if (profilesError) {
        console.error('[TicketService] Error fetching profiles:', profilesError);
        // Continue without user info rather than failing
      }

      // Create a map of user info
      const userMap = new Map();
      if (profiles) {
        profiles.forEach((profile: any) => {
          userMap.set(profile.id, profile);
        });
      }

      // Combine tickets with user info
      const ticketsWithUsers = tickets.map((ticket: any) => {
        const user = userMap.get(ticket.user_id);
        return {
          ...ticket,
          user_email: user?.email || 'Unknown',
          user_name: user?.full_name || 'Unknown User',
        };
      });

      return ticketsWithUsers;
    } catch (error) {
      console.error('[TicketService] getAllTickets failed:', error);
      throw error;
    }
  },

  /**
   * Update ticket status (admin only)
   */
  async updateTicketStatus(
    ticketId: string,
    status: TicketStatus,
    adminNotes?: string,
    resolvedBy?: string
  ): Promise<SupportTicket> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (adminNotes) {
        updateData.admin_notes = adminNotes;
      }

      if (status === 'resolved' || status === 'closed') {
        updateData.resolved_at = new Date().toISOString();
        if (resolvedBy) {
          updateData.resolved_by = resolvedBy;
        }
      }

      const { data, error } = await (supabaseAdmin as any)
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId)
        .select()
        .single();

      if (error) {
        console.error('[TicketService] Error updating ticket status:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[TicketService] updateTicketStatus failed:', error);
      throw error;
    }
  },

  /**
   * Get ticket statistics (admin only)
   */
  async getTicketStats(): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  }> {
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from('support_tickets')
        .select('status');

      if (error) {
        console.error('[TicketService] Error fetching ticket stats:', error);
        throw error;
      }

      const stats = {
        total: data.length,
        open: data.filter((t: any) => t.status === 'open').length,
        inProgress: data.filter((t: any) => t.status === 'in_progress').length,
        resolved: data.filter((t: any) => t.status === 'resolved').length,
        closed: data.filter((t: any) => t.status === 'closed').length,
        in_progress: data.filter((t: any) => t.status === 'in_progress').length,
      };

      return stats;
    } catch (error) {
      console.error('[TicketService] getTicketStats failed:', error);
      throw error;
    }
  },
};
