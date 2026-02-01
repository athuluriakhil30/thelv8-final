import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * Cleanup Abandoned Orders API
 * 
 * This endpoint cancels orders that:
 * - Have payment_status = 'pending'
 * - Have payment_method = 'razorpay' (not COD)
 * - Were created more than X minutes ago (default: 30 minutes)
 * - Have no payment_id (payment was never completed)
 * 
 * This restores stock for abandoned carts where users:
 * - Closed the browser during payment
 * - Switched apps and never returned
 * - Had network issues and couldn't complete
 * 
 * Endpoints:
 * - GET: Vercel cron (runs cleanup) or admin (gets stats with ?stats=true)
 * - POST: Admin manual cleanup with options
 * 
 * Security:
 * - Vercel cron: CRON_SECRET in Authorization header
 * - Admin: Bearer token with admin role
 */

// Helper function to run cleanup
async function runCleanup(abandonedMinutes: number, dryRun: boolean, requestId: string) {
    const cutoffTime = new Date(Date.now() - abandonedMinutes * 60 * 1000).toISOString();
    
    console.log(`[Cleanup ${requestId}] Looking for orders older than ${abandonedMinutes} min, cutoff: ${cutoffTime}`);

    // Find abandoned orders
    const { data: abandonedOrders, error: fetchError } = await supabaseAdmin
        .from('orders')
        .select('id, order_number, total, created_at, items, user_id')
        .eq('payment_status', 'pending')
        .eq('payment_method', 'razorpay')
        .is('payment_id', null)
        .lt('created_at', cutoffTime)
        .order('created_at', { ascending: true });

    if (fetchError) {
        console.error(`[Cleanup ${requestId}] Error fetching:`, fetchError);
        throw new Error('Failed to fetch abandoned orders');
    }

    if (!abandonedOrders || abandonedOrders.length === 0) {
        console.log(`[Cleanup ${requestId}] No abandoned orders found`);
        return { success: true, message: 'No abandoned orders found', cleaned: 0, failed: 0, dryRun };
    }

    console.log(`[Cleanup ${requestId}] Found ${abandonedOrders.length} abandoned orders`);

    if (dryRun) {
        return {
            success: true,
            message: `Found ${abandonedOrders.length} orders (dry run)`,
            dryRun: true,
            cleaned: 0,
            failed: 0,
            orders: abandonedOrders.map(o => ({
                id: o.id,
                order_number: o.order_number,
                total: o.total,
                created_at: o.created_at,
                age_minutes: Math.round((Date.now() - new Date(o.created_at).getTime()) / 60000),
            })),
        };
    }

    // Cancel each order and restore stock
    const results: Array<{ orderId: string; orderNumber: string; success: boolean; error?: string }> = [];
    
    for (const order of abandonedOrders) {
        try {
            const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
            
            // Restore stock for each item
            for (const item of items || []) {
                try {
                    if (item.selected_color && item.selected_size) {
                        await supabaseAdmin.rpc('increase_stock_color_size', {
                            p_product_id: item.product_id,
                            p_color: item.selected_color,
                            p_size: item.selected_size,
                            p_quantity: item.quantity,
                        });
                    } else if (item.selected_size) {
                        await supabaseAdmin.rpc('increase_product_stock', {
                            p_product_id: item.product_id,
                            p_size: item.selected_size,
                            p_quantity: item.quantity,
                        });
                    }
                } catch (stockError) {
                    console.error(`[Cleanup ${requestId}] Stock restore failed for ${item.product_id}:`, stockError);
                }
            }

            // Cancel the order
            await supabaseAdmin
                .from('orders')
                .update({
                    status: 'cancelled',
                    notes: `Auto-cancelled: Payment not completed within ${abandonedMinutes} minutes`,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', order.id);

            results.push({ orderId: order.id, orderNumber: order.order_number, success: true });
            console.log(`[Cleanup ${requestId}] Cancelled ${order.order_number}`);
        } catch (error: any) {
            console.error(`[Cleanup ${requestId}] Failed to cancel ${order.order_number}:`, error);
            results.push({ orderId: order.id, orderNumber: order.order_number, success: false, error: error?.message });
        }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`[Cleanup ${requestId}] Done: ${successCount} cancelled, ${failCount} failed`);

    return {
        success: true,
        message: `Cleaned up ${successCount} abandoned orders`,
        cleaned: successCount,
        failed: failCount,
        results,
    };
}

// Helper to check admin auth
async function isAdmin(authHeader: string | null): Promise<boolean> {
    if (!authHeader?.startsWith('Bearer ')) return false;
    
    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return false;
    
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    
    return profile?.role === 'admin';
}

/**
 * GET - Vercel Cron (cleanup) or Admin (stats)
 */
export async function GET(request: NextRequest) {
    const requestId = `get_${Date.now()}`;
    const authHeader = request.headers.get('authorization');
    const url = new URL(request.url);
    const wantStats = url.searchParams.get('stats') === 'true';

    // Check if this is a Vercel cron request
    const cronSecret = process.env.CRON_SECRET;
    const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (isCron && !wantStats) {
        // Vercel cron - run cleanup
        console.log(`[Cleanup ${requestId}] Vercel cron triggered`);
        try {
            const result = await runCleanup(30, false, requestId);
            return NextResponse.json(result);
        } catch (error: any) {
            console.error(`[Cleanup ${requestId}] Cron error:`, error);
            return NextResponse.json({ error: 'Cleanup failed', details: error?.message }, { status: 500 });
        }
    }

    // Admin requesting stats
    if (!(await isAdmin(authHeader))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get abandoned order statistics
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: orders, error } = await supabaseAdmin
        .from('orders')
        .select('id, order_number, total, created_at')
        .eq('payment_status', 'pending')
        .eq('payment_method', 'razorpay')
        .is('payment_id', null)
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }

    const allOrders = orders || [];
    
    return NextResponse.json({
        total_abandoned: allOrders.length,
        older_than_30_min: allOrders.filter(o => o.created_at < thirtyMinAgo).length,
        older_than_1_hour: allOrders.filter(o => o.created_at < oneHourAgo).length,
        older_than_24_hours: allOrders.filter(o => o.created_at < oneDayAgo).length,
        total_value_locked: allOrders.reduce((sum, o) => sum + (o.total || 0), 0),
        orders: allOrders.slice(0, 20).map(o => ({
            id: o.id,
            order_number: o.order_number,
            total: o.total,
            created_at: o.created_at,
            age_minutes: Math.round((Date.now() - new Date(o.created_at).getTime()) / 60000),
        })),
    });
}

/**
 * POST - Admin manual cleanup with options
 */
export async function POST(request: NextRequest) {
    const requestId = `post_${Date.now()}`;
    const authHeader = request.headers.get('authorization');
    const cronSecretHeader = request.headers.get('x-cron-secret');

    // Check authorization
    const cronSecret = process.env.CRON_SECRET;
    const isCron = cronSecret && cronSecretHeader === cronSecret;
    const isAdminUser = await isAdmin(authHeader);

    if (!isCron && !isAdminUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const abandonedMinutes = body.abandonedMinutes || 30;
        const dryRun = body.dryRun || false;

        console.log(`[Cleanup ${requestId}] Manual cleanup: ${abandonedMinutes} min, dryRun: ${dryRun}`);
        
        const result = await runCleanup(abandonedMinutes, dryRun, requestId);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error(`[Cleanup ${requestId}] Error:`, error);
        return NextResponse.json({ error: 'Cleanup failed', details: error?.message }, { status: 500 });
    }
}
