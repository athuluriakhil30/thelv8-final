'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Ticket, Clock, AlertCircle, CheckCircle2, XCircle, Loader2, Search, Filter, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface TicketDisplay {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  chat_context: any;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  user_email?: string;
  user_name?: string;
}

export default function AdminTicketsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<TicketDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<TicketDisplay | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('Please login to access admin panel');
      router.push('/shop');
      return;
    }
    
    loadTickets();
    loadStats();
  }, [user, authLoading, router]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/tickets');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load tickets');
      }
      
      setTickets(data.tickets);
    } catch (error: any) {
      console.error('Error loading tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/tickets/stats');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load stats');
      }
      
      setStats(data);
    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  };

  const handleStatusUpdate = async (ticketId: string, newStatus: string) => {
    try {
      const updateData: any = {
        status: newStatus,
      };
      if (adminNotes) {
        updateData.adminNotes = adminNotes;
      }
      
      const response = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update ticket');
      }
      
      toast.success('Ticket status updated successfully');
      loadTickets();
      loadStats();
      setSelectedTicket(null);
      setAdminNotes('');
    } catch (error: any) {
      console.error('Error updating ticket:', error);
      toast.error('Failed to update ticket');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'resolved':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'closed':
        return <XCircle className="w-4 h-4 text-stone-500" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-300';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    const matchesSearch = 
      searchQuery === '' ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user_email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Ticket className="w-8 h-8 text-stone-900" />
            <h1 className="text-3xl font-light text-stone-900">Support Tickets</h1>
          </div>
          <p className="text-stone-600">Manage customer support requests</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-2xl font-bold text-stone-900">{stats.total}</div>
              <div className="text-sm text-stone-600">Total Tickets</div>
            </div>
            <div className="bg-red-50 p-6 rounded-xl shadow-sm border border-red-200">
              <div className="text-2xl font-bold text-red-700">{stats.open}</div>
              <div className="text-sm text-red-600">Open</div>
            </div>
            <div className="bg-blue-50 p-6 rounded-xl shadow-sm border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">{stats.in_progress}</div>
              <div className="text-sm text-blue-600">In Progress</div>
            </div>
            <div className="bg-green-50 p-6 rounded-xl shadow-sm border border-green-200">
              <div className="text-2xl font-bold text-green-700">{stats.resolved}</div>
              <div className="text-sm text-green-600">Resolved</div>
            </div>
            <div className="bg-stone-100 p-6 rounded-xl shadow-sm border border-stone-300">
              <div className="text-2xl font-bold text-stone-700">{stats.closed}</div>
              <div className="text-sm text-stone-600">Closed</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-900 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-900 focus:border-transparent appearance-none"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-900 focus:border-transparent appearance-none"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {filteredTickets.length === 0 ? (
            <div className="p-12 text-center">
              <Ticket className="w-16 h-16 text-stone-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-stone-900 mb-2">No Tickets Found</h3>
              <p className="text-stone-600">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-200">
              {filteredTickets.map((ticket) => (
                <div key={ticket.id} className="p-6 hover:bg-stone-50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Priority Badge */}
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority.toUpperCase()}
                    </div>

                    {/* Ticket Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-stone-900 mb-1">{ticket.subject}</h3>
                          <div className="flex items-center gap-4 text-sm text-stone-600">
                            <span>{ticket.user_email}</span>
                            <span>•</span>
                            <span className="capitalize">{ticket.category}</span>
                            <span>•</span>
                            <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(ticket.status)}
                          <span className="text-sm font-medium capitalize">{ticket.status.replace('_', ' ')}</span>
                        </div>
                      </div>

                      <p className="text-stone-700 text-sm mb-3 line-clamp-2">{ticket.description}</p>

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)}
                          className="text-sm text-stone-600 hover:text-stone-900 flex items-center gap-1"
                        >
                          {expandedTicket === ticket.id ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              Hide Details
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              View Details
                            </>
                          )}
                        </button>
                        
                        {ticket.status !== 'closed' && (
                          <>
                            {ticket.status === 'open' && (
                              <button
                                onClick={() => handleStatusUpdate(ticket.id, 'in_progress')}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Start Working
                              </button>
                            )}
                            {ticket.status === 'in_progress' && (
                              <button
                                onClick={() => handleStatusUpdate(ticket.id, 'resolved')}
                                className="text-sm text-green-600 hover:text-green-700 font-medium"
                              >
                                Mark Resolved
                              </button>
                            )}
                            {ticket.status === 'resolved' && (
                              <button
                                onClick={() => handleStatusUpdate(ticket.id, 'closed')}
                                className="text-sm text-stone-600 hover:text-stone-700 font-medium"
                              >
                                Close Ticket
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      {/* Expanded Details */}
                      {expandedTicket === ticket.id && (
                        <div className="mt-4 pt-4 border-t border-stone-200 space-y-4">
                          {/* Full Description */}
                          <div>
                            <h4 className="font-medium text-stone-900 mb-2">Full Description</h4>
                            <p className="text-stone-700 text-sm whitespace-pre-wrap">{ticket.description}</p>
                          </div>

                          {/* Chat Context */}
                          {ticket.chat_context && Array.isArray(ticket.chat_context) && ticket.chat_context.length > 0 && (
                            <div>
                              <h4 className="font-medium text-stone-900 mb-2 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Chat History ({ticket.chat_context.length} messages)
                              </h4>
                              <div className="bg-stone-50 rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                                {ticket.chat_context.map((msg: any, idx: number) => (
                                  <div key={idx} className={`text-sm ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                    <div className={`inline-block px-3 py-2 rounded-lg ${
                                      msg.role === 'user' ? 'bg-stone-900 text-white' : 'bg-white text-stone-900'
                                    }`}>
                                      {msg.content}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Admin Notes */}
                          {ticket.admin_notes && (
                            <div>
                              <h4 className="font-medium text-stone-900 mb-2">Admin Notes</h4>
                              <p className="text-stone-700 text-sm bg-blue-50 p-3 rounded-lg">{ticket.admin_notes}</p>
                            </div>
                          )}

                          {/* Add/Edit Admin Notes */}
                          {ticket.status !== 'closed' && (
                            <div>
                              <h4 className="font-medium text-stone-900 mb-2">Add Notes</h4>
                              <textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Add internal notes about this ticket..."
                                rows={3}
                                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-900 focus:border-transparent resize-none text-sm"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
