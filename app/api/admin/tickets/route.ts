import { NextRequest, NextResponse } from 'next/server';
import { ticketService } from '@/services/ticket.service';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    
    const tickets = await ticketService.getAllTickets();
    return NextResponse.json({ tickets });

  } catch (error: any) {
    console.error('[Admin Tickets API] Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets', details: error.message },
      { status: 500 }
    );
  }
}
