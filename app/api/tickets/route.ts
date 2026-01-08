import { NextRequest, NextResponse } from 'next/server';
import { ticketService } from '@/services/ticket.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, subject, description, category, priority, chatContext } = body;

    if (!userId || !subject || !description) {
      return NextResponse.json(
        { error: 'userId, subject, and description are required' },
        { status: 400 }
      );
    }

    const ticket = await ticketService.createTicket({
      userId,
      subject,
      description,
      category,
      priority,
      chatContext,
    });

    return NextResponse.json({ ticket }, { status: 201 });

  } catch (error: any) {
    console.error('[Ticket API] Error creating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const tickets = await ticketService.getUserTickets(userId);

    return NextResponse.json({ tickets });

  } catch (error: any) {
    console.error('[Ticket API] Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets', details: error.message },
      { status: 500 }
    );
  }
}
