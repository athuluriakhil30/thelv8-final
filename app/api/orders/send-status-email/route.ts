import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { emailService } from '@/services/email.service';

// Server-side Supabase client with service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    const { orderId, newStatus } = await request.json();

    if (!orderId || !newStatus) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Fetch user email
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(order.user_id);

    if (userError || !user?.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 404 }
      );
    }

    // Send appropriate email based on status
    const statusMessages: Record<string, string> = {
      pending: 'Your order has been received and is being processed.',
      processing: 'Your order is currently being prepared for shipment.',
      shipped: 'Your order has been shipped and is on its way to you!',
      delivered: 'Your order has been delivered successfully!',
      cancelled: 'Your order has been cancelled.',
    };

    let result;

    if (newStatus === 'shipped') {
      result = await emailService.sendOrderShipped({
        to: user.email,
        customerName: order.shipping_address.full_name,
        orderNumber: order.order_number,
        orderId: order.id,
      });
    } else if (newStatus === 'delivered') {
      result = await emailService.sendOrderDelivered({
        to: user.email,
        customerName: order.shipping_address.full_name,
        orderNumber: order.order_number,
        orderId: order.id,
      });
    } else if (newStatus === 'cancelled') {
      result = await emailService.sendOrderCancelled({
        to: user.email,
        customerName: order.shipping_address.full_name,
        orderNumber: order.order_number,
        orderId: order.id,
      });
    } else {
      result = await emailService.sendOrderStatusUpdate({
        to: user.email,
        customerName: order.shipping_address.full_name,
        orderNumber: order.order_number,
        orderId: order.id,
        status: newStatus,
        statusMessage: statusMessages[newStatus] || 'Your order status has been updated.',
      });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Order status email error:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
