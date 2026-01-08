import { NextRequest, NextResponse } from 'next/server';
import { ticketService } from '@/services/ticket.service';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Add admin authentication check here
    
    const { id } = await params;
    const body = await request.json();
    const { status, adminNotes, resolvedBy } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const ticket = await ticketService.updateTicketStatus(
      id,
      status,
      adminNotes,
      resolvedBy
    );

    return NextResponse.json({ ticket });

  } catch (error: any) {
    console.error('[Admin Ticket Update API] Error updating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket', details: error.message },
      { status: 500 }
    );
  }
}
