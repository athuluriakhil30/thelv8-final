import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/services/email.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: type and data' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'order_confirmation':
        result = await emailService.sendOrderConfirmation(data);
        break;

      case 'order_status_update':
        result = await emailService.sendOrderStatusUpdate(data);
        break;

      case 'order_shipped':
        result = await emailService.sendOrderShipped(data);
        break;

      case 'order_delivered':
        result = await emailService.sendOrderDelivered(data);
        break;

      case 'order_cancelled':
        result = await emailService.sendOrderCancelled(data);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
