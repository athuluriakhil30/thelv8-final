import { NextRequest, NextResponse } from 'next/server';
import { orderService } from '@/services/order.service';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * Manual Payment Verification Endpoint
 * 
 * This endpoint allows manual verification of payments when:
 * - Razorpay returns 500 errors during checkout
 * - Payment was captured but webhook didn't process
 * - User received payment_id but order status wasn't updated
 * 
 * Security:
 * - User must be authenticated
 * - User can only verify their own orders
 * - Admin can verify any order
 * 
 * Usage:
 * POST /api/razorpay/verify-payment
 * Body: { orderId: "uuid", paymentId: "pay_xxx" (optional) }
 */

export async function POST(request: NextRequest) {
    try {
        // Get authorization header
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Unauthorized - Missing or invalid token' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);

        // Verify user
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized - Invalid token' },
                { status: 401 }
            );
        }

        // Get request body
        const body = await request.json();
        const { orderId, paymentId } = body;

        if (!orderId) {
            return NextResponse.json(
                { error: 'Missing orderId in request body' },
                { status: 400 }
            );
        }

        console.log(`[Verify Payment] User ${user.id} verifying order ${orderId}`);

        // Get order
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            console.error('[Verify Payment] Order not found:', orderError);
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Check if user owns this order (unless admin)
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        const isAdmin = profile?.role === 'admin';

        if (!isAdmin && order.user_id !== user.id) {
            console.warn(`[Verify Payment] User ${user.id} attempted to verify order ${orderId} belonging to ${order.user_id}`);
            return NextResponse.json(
                { error: 'Forbidden - You can only verify your own orders' },
                { status: 403 }
            );
        }

        // Check if order is already paid
        if (order.payment_status === 'paid') {
            console.log('[Verify Payment] Order already marked as paid');
            return NextResponse.json({
                success: true,
                message: 'Order is already marked as paid',
                order: {
                    id: order.id,
                    order_number: order.order_number,
                    payment_status: order.payment_status,
                    payment_id: order.payment_id,
                    status: order.status,
                },
            });
        }

        // If no razorpay_order_id, cannot verify via API
        if (!order.razorpay_order_id) {
            console.error('[Verify Payment] Order has no razorpay_order_id:', order.order_number);
            return NextResponse.json({
                success: false,
                error: 'Order missing Razorpay order ID. Cannot verify automatically.',
                order: {
                    id: order.id,
                    order_number: order.order_number,
                    payment_status: order.payment_status,
                },
                recommendation: 'Contact support with your payment ID for manual verification',
            }, { status: 400 });
        }

        // Verify payment with Razorpay API
        const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
        const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!razorpayKeyId || !razorpayKeySecret) {
            console.error('[Verify Payment] Razorpay credentials not configured');
            return NextResponse.json(
                { error: 'Payment gateway not configured' },
                { status: 500 }
            );
        }

        // Fetch Razorpay order details
        const authString = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');
        const razorpayResponse = await fetch(
            `https://api.razorpay.com/v1/orders/${order.razorpay_order_id}/payments`,
            {
                headers: {
                    'Authorization': `Basic ${authString}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!razorpayResponse.ok) {
            console.error('[Verify Payment] Razorpay API error:', razorpayResponse.status);
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch payment status from Razorpay',
                order: {
                    id: order.id,
                    order_number: order.order_number,
                    payment_status: order.payment_status,
                },
            }, { status: 500 });
        }

        const razorpayData = await razorpayResponse.json();
        console.log('[Verify Payment] Razorpay API response:', {
            order_id: order.razorpay_order_id,
            payments_count: razorpayData.count,
        });

        // Check if any payment was captured
        const capturedPayment = razorpayData.items?.find((p: any) => 
            p.status === 'captured' && p.captured === true
        );

        if (capturedPayment) {
            console.log('[Verify Payment] ✅ Found captured payment:', capturedPayment.id);

            // Update order status
            const { error: updateError } = await supabaseAdmin
                .from('orders')
                .update({
                    payment_status: 'paid',
                    payment_id: capturedPayment.id,
                    status: order.status === 'pending' ? 'confirmed' : order.status,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', order.id);

            if (updateError) {
                console.error('[Verify Payment] Error updating order:', updateError);
                return NextResponse.json(
                    { error: 'Failed to update order status' },
                    { status: 500 }
                );
            }

            // Send confirmation email
            try {
                const { emailClient } = await import('@/lib/email-client');
                
                // Parse shipping_address from order (it's stored as JSON)
                const shippingAddress = typeof order.shipping_address === 'string' 
                    ? JSON.parse(order.shipping_address) 
                    : order.shipping_address;

                if (shippingAddress) {
                    // Parse items from JSON
                    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                    
                    await emailClient.sendOrderConfirmation({
                        to: user.email || '',
                        customerName: shippingAddress.full_name,
                        orderNumber: order.order_number,
                        orderId: order.id,
                        orderDate: new Date(order.created_at).toLocaleDateString('en-IN'),
                        items: Array.isArray(items) ? items : [],
                        subtotal: order.subtotal || 0,
                        shippingCharge: order.shipping_charge || 0,
                        tax: order.tax || 0,
                        discount: order.discount || 0,
                        total: order.total || 0,
                        shippingAddress: {
                            full_name: shippingAddress.full_name,
                            phone: shippingAddress.phone,
                            address_line1: shippingAddress.address_line1,
                            address_line2: shippingAddress.address_line2 || undefined,
                            city: shippingAddress.city,
                            state: shippingAddress.state,
                            pincode: shippingAddress.pincode,
                        },
                        paymentMethod: 'Online Payment',
                    });
                }
            } catch (emailError) {
                console.error('[Verify Payment] Failed to send confirmation email:', emailError);
                // Don't fail the request if email fails
            }

            return NextResponse.json({
                success: true,
                message: 'Payment verified and order updated successfully',
                order: {
                    id: order.id,
                    order_number: order.order_number,
                    payment_status: 'paid',
                    payment_id: capturedPayment.id,
                    status: order.status === 'pending' ? 'confirmed' : order.status,
                },
                payment: {
                    id: capturedPayment.id,
                    amount: capturedPayment.amount,
                    method: capturedPayment.method,
                    status: capturedPayment.status,
                },
            });
        }

        // No captured payment found
        console.log('[Verify Payment] No captured payment found for order');
        return NextResponse.json({
            success: false,
            message: 'No successful payment found for this order',
            order: {
                id: order.id,
                order_number: order.order_number,
                payment_status: order.payment_status,
                razorpay_order_id: order.razorpay_order_id,
            },
            payments: razorpayData.items?.map((p: any) => ({
                id: p.id,
                status: p.status,
                method: p.method,
                amount: p.amount,
            })) || [],
            recommendation: paymentId 
                ? `Payment ID ${paymentId} was not found or not captured for this order`
                : 'If you completed payment, please provide the payment ID for manual verification',
        }, { status: 404 });

    } catch (error) {
        console.error('[Verify Payment] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
