import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { getCurrentUser } from '@/lib/supabase/client';

/**
 * PATCH /api/orders
 * Update order with additional information (like Razorpay order_id)
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, notes, payment_id } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Verify order belongs to user
    const { data: existingOrder, error: fetchError } = await supabase
      .from('orders')
      .select('id, user_id')
      .eq('id', orderId)
      .single();

    if (fetchError || !existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (existingOrder.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this order' },
        { status: 403 }
      );
    }

    // Update order
    const updates: any = {};
    if (notes !== undefined) updates.notes = notes;
    if (payment_id !== undefined) updates.payment_id = payment_id;

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('[Orders API] Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, order: data });
  } catch (error: any) {
    console.error('[Orders API] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
