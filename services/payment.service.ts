import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/server';
import { Insertable, handleSupabaseResponse } from '@/lib/supabase/types';

/**
 * Payment Service
 * Handles Razorpay payment verification, webhook processing, and payment logging
 */

interface RazorpayWebhookEvent {
    event: string;
    payload: {
        payment: {
            entity: {
                id: string;
                order_id: string;
                amount: number;
                currency: string;
                status: string;
                method: string;
                captured: boolean;
                email: string;
                contact: string;
                error_code?: string;
                error_description?: string;
                created_at: number;
            };
        };
    };
    created_at: number;
}

interface PaymentLog {
    id?: string;
    payment_id: string;
    razorpay_order_id: string;
    order_id?: string | null;
    event_type: string;
    status: string;
    amount: number;
    currency: string | null; // Allow null to match database type
    payment_method?: string | null;
    error_code?: string | null;
    error_description?: string | null;
    webhook_signature?: string | null;
    webhook_payload: any;
    verified: boolean | null; // Allow null to match database type
    created_at?: string | null;
}

export const paymentService = {
    /**
     * Verify Razorpay webhook signature using HMAC SHA256
     * @param webhookBody - Raw webhook request body as string
     * @param signature - Razorpay signature from header
     * @param secret - Webhook secret from environment
     * @returns boolean indicating if signature is valid
     */
    verifyWebhookSignature(
        webhookBody: string,
        signature: string,
        secret: string
    ): boolean {
        try {
            const expectedSignature = crypto
                .createHmac('sha256', secret)
                .update(webhookBody)
                .digest('hex');

            // Convert to Uint8Array for timing-safe comparison
            const sigBuffer = new Uint8Array(Buffer.from(signature, 'utf8'));
            const expectedBuffer = new Uint8Array(Buffer.from(expectedSignature, 'utf8'));

            return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
        } catch (error) {
            console.error('[PaymentService] Signature verification error:', error);
            return false;
        }
    },

    /**
     * Verify Razorpay payment signature (for client-side payments)
     * @param orderId - Razorpay order ID
     * @param paymentId - Razorpay payment ID
     * @param signature - Payment signature
     * @param secret - Razorpay key secret
     * @returns boolean indicating if signature is valid
     */
    verifyPaymentSignature(
        orderId: string,
        paymentId: string,
        signature: string,
        secret: string
    ): boolean {
        try {
            const body = orderId + '|' + paymentId;
            const expectedSignature = crypto
                .createHmac('sha256', secret)
                .update(body)
                .digest('hex');

            // Convert to Uint8Array for timing-safe comparison
            const sigBuffer = new Uint8Array(Buffer.from(signature, 'utf8'));
            const expectedBuffer = new Uint8Array(Buffer.from(expectedSignature, 'utf8'));

            return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
        } catch (error) {
            console.error('[PaymentService] Payment signature verification error:', error);
            return false;
        }
    },

    /**
     * Process payment webhook event
     * @param event - Webhook event data from Razorpay
     * @param verified - Whether webhook signature was verified
     */
    async processWebhookEvent(
        event: RazorpayWebhookEvent,
        verified: boolean
    ): Promise<void> {
        const { event: eventType, payload } = event;
        const payment = payload.payment.entity;

        console.log(`[PaymentService] Processing event: ${eventType}`, {
            paymentId: payment.id,
            orderId: payment.order_id,
            status: payment.status,
            verified,
        });

        // Log payment event
        await this.logPaymentEvent(payment, eventType, verified);

        // Only process verified webhooks to prevent tampering
        if (!verified) {
            console.warn('[PaymentService] Skipping unverified webhook event');
            return;
        }

        // Handle different event types
        switch (eventType) {
            case 'payment.captured':
                await this.handlePaymentCaptured(payment);
                break;

            case 'payment.failed':
                await this.handlePaymentFailed(payment);
                break;

            case 'payment.refunded':
                await this.handlePaymentRefunded(payment);
                break;

            default:
                console.log(`[PaymentService] Unhandled event type: ${eventType}`);
        }
    },

    /**
     * Handle successful payment capture
     */
    async handlePaymentCaptured(payment: any): Promise<void> {
        try {
            console.log('[PaymentService] Payment captured:', payment.id);

            // Find order by Razorpay order ID and payment notes
            const order = await this.findOrderByRazorpayOrderId(payment.order_id, payment.notes);

            if (!order) {
                console.error('[PaymentService] Order not found for payment:', payment.order_id);
                return;
            }

            // Update order payment status
            const { error } = await supabaseAdmin
                .from('orders')
                .update({
                    payment_status: 'paid',
                    payment_id: payment.id,
                    status: order.status === 'pending' ? 'confirmed' : order.status,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', order.id);

            if (error) {
                console.error('[PaymentService] Error updating order:', error);
                throw error;
            }

            console.log('[PaymentService] Order updated successfully:', order.order_number);
        } catch (error) {
            console.error('[PaymentService] Error handling payment captured:', error);
            throw error;
        }
    },

    /**
     * Handle failed payment
     */
    async handlePaymentFailed(payment: any): Promise<void> {
        try {
            console.log('[PaymentService] Payment failed:', payment.id);

            const order = await this.findOrderByRazorpayOrderId(payment.order_id, payment.notes);

            if (!order) {
                console.error('[PaymentService] Order not found for payment:', payment.order_id);
                return;
            }

            // Update order payment status
            const { error } = await supabaseAdmin
                .from('orders')
                .update({
                    payment_status: 'failed',
                    payment_id: payment.id,
                    notes: payment.error_description || 'Payment failed',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', order.id);

            if (error) {
                console.error('[PaymentService] Error updating order:', error);
                throw error;
            }

            console.log('[PaymentService] Order marked as failed:', order.order_number);
        } catch (error) {
            console.error('[PaymentService] Error handling payment failed:', error);
            throw error;
        }
    },

    /**
     * Handle payment refund
     */
    async handlePaymentRefunded(payment: any): Promise<void> {
        try {
            console.log('[PaymentService] Payment refunded:', payment.id);

            const order = await this.findOrderByRazorpayOrderId(payment.order_id, payment.notes);

            if (!order) {
                console.error('[PaymentService] Order not found for payment:', payment.order_id);
                return;
            }

            // Update order payment and order status
            const { error } = await supabaseAdmin
                .from('orders')
                .update({
                    payment_status: 'refunded',
                    status: 'refunded',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', order.id);

            if (error) {
                console.error('[PaymentService] Error updating order:', error);
                throw error;
            }

            console.log('[PaymentService] Order refunded:', order.order_number);
        } catch (error) {
            console.error('[PaymentService] Error handling payment refunded:', error);
            throw error;
        }
    },

    /**
     * Find order by Razorpay order ID or payment notes
     */
    async findOrderByRazorpayOrderId(razorpayOrderId: string, paymentNotes?: any): Promise<any | null> {
        try {
            // Method 1: If payment notes contain order_id (most reliable for new orders)
            if (paymentNotes?.order_id) {
                console.log('[PaymentService] Finding order from payment notes:', paymentNotes.order_id);
                const { data: order, error: orderError } = await supabaseAdmin
                    .from('orders')
                    .select('*')
                    .eq('id', paymentNotes.order_id)
                    .single();

                if (!orderError && order) {
                    console.log('[PaymentService] Order found via payment notes:', order.order_number);
                    return order;
                }
            }

            // Method 2: Search orders by Razorpay order ID directly
            // Orders store the Razorpay order_id when they're created
            console.log('[PaymentService] Searching orders by razorpay_order_id:', razorpayOrderId);
            
            // We need to search in the payment_id field or notes
            // Since we pass Razorpay order_id when creating the order
            const { data: orders, error: searchError } = await supabaseAdmin
                .from('orders')
                .select('*')
                .or(`payment_id.eq.${razorpayOrderId},notes.ilike.%${razorpayOrderId}%`)
                .limit(1);

            if (!searchError && orders && orders.length > 0) {
                console.log('[PaymentService] Order found via razorpay_order_id:', orders[0].order_number);
                return orders[0];
            }

            // Method 3: Check payment_logs for historical data
            const { data: logData, error: logError } = await supabaseAdmin
                .from('payment_logs')
                .select('order_id')
                .eq('razorpay_order_id', razorpayOrderId)
                .not('order_id', 'is', null)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (logData?.order_id) {
                console.log('[PaymentService] Order found via payment_logs:', logData.order_id);
                const { data: order, error: orderError } = await supabaseAdmin
                    .from('orders')
                    .select('*')
                    .eq('id', logData.order_id)
                    .single();

                if (!orderError && order) {
                    return order;
                }
            }

            console.error('[PaymentService] Could not find order for razorpay_order_id:', razorpayOrderId);
            return null;
        } catch (error) {
            console.error('[PaymentService] Error finding order:', error);
            return null;
        }
    },

    /**
     * Log payment event to database for reconciliation
     */
    async logPaymentEvent(
        payment: any,
        eventType: string,
        verified: boolean
    ): Promise<void> {
        try {
            // Extract order_id from payment notes if available (Razorpay passes it back)
            const orderId = payment.notes?.order_id || null;

            console.log('[PaymentService] Preparing to log payment event:', {
                payment_id: payment.id,
                razorpay_order_id: payment.order_id,
                order_id: orderId,
                event_type: eventType,
                status: payment.status,
                verified,
            });

            const paymentLog: Omit<PaymentLog, 'id' | 'created_at'> = {
                payment_id: payment.id,
                razorpay_order_id: payment.order_id,
                order_id: orderId, // Now populated from payment notes
                event_type: eventType,
                status: payment.status,
                amount: payment.amount / 100, // Convert paise to rupees
                currency: payment.currency,
                payment_method: payment.method || null,
                error_code: payment.error_code || null,
                error_description: payment.error_description || null,
                webhook_signature: null,
                webhook_payload: payment,
                verified,
            };

            console.log('[PaymentService] Inserting payment log into database...');
            const { data, error } = await supabaseAdmin.from('payment_logs').insert(paymentLog).select();

            if (error) {
                console.error('[PaymentService] ❌ ERROR logging payment event:');
                console.error('[PaymentService] Error code:', error.code);
                console.error('[PaymentService] Error message:', error.message);
                console.error('[PaymentService] Error details:', error.details);
                console.error('[PaymentService] Error hint:', error.hint);
            } else {
                console.log('[PaymentService] ✅ Payment event logged successfully:', payment.id, 'for order:', orderId);
                console.log('[PaymentService] Inserted record:', data?.[0]?.id);
            }
        } catch (error: any) {
            console.error('[PaymentService] ❌ EXCEPTION in logPaymentEvent:');
            console.error('[PaymentService] Error type:', error?.constructor?.name);
            console.error('[PaymentService] Error message:', error?.message);
            console.error('[PaymentService] Error stack:', error?.stack);
            // Don't throw - logging failure shouldn't break webhook processing
        }
    },

    /**
     * Create payment log when order is created (for reconciliation)
     */
    async createOrderPaymentLog(
        orderId: string,
        razorpayOrderId: string,
        amount: number
    ): Promise<void> {
        try {
            const paymentLog: Omit<PaymentLog, 'id' | 'created_at'> = {
                payment_id: 'pending',
                razorpay_order_id: razorpayOrderId,
                order_id: orderId,
                event_type: 'order.created',
                status: 'pending',
                amount,
                currency: 'INR',
                payment_method: null,
                error_code: null,
                error_description: null,
                webhook_signature: null,
                webhook_payload: { razorpay_order_id: razorpayOrderId, order_id: orderId },
                verified: true,
            };

            const { error } = await supabaseAdmin.from('payment_logs').insert(paymentLog);

            if (error) {
                console.error('[PaymentService] Error creating order payment log:', error);
            }
        } catch (error) {
            console.error('[PaymentService] Error in createOrderPaymentLog:', error);
        }
    },

    /**
     * Get payment logs for an order
     */
    async getPaymentLogs(orderId: string): Promise<PaymentLog[]> {
        try {
            const { data, error } = await supabaseAdmin
                .from('payment_logs')
                .select('*')
                .eq('order_id', orderId)
                .order('created_at', { ascending: false });

            if (error) {
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('[PaymentService] Error in getPaymentLogs:', error);
            return [];
        }
    },
};

export default paymentService;
