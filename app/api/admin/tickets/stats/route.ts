import { NextRequest, NextResponse } from 'next/server';
import { ticketService } from '@/services/ticket.service';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    
    const stats = await ticketService.getTicketStats();
    return NextResponse.json(stats);

  } catch (error: any) {
    console.error('[Admin Ticket Stats API] Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error.message },
      { status: 500 }
    );
  }
}
