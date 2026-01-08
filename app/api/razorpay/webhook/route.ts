import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/services/payment.service';

/**
 * Razorpay Webhook Handler
 * 
 * This endpoint receives payment events from Razorpay and processes them securely.
 * 
 * Security:
 * - Verifies webhook signature using HMAC SHA256
 * - Only processes verified webhooks to prevent tampering
 * - Logs all webhook attempts for reconciliation
 * 
 * Events Handled:
 * - payment.captured: Payment successfully captured
 * - payment.failed: Payment failed
 * - payment.refunded: Payment refunded
 * 
 * Setup Instructions:
 * 1. Add RAZORPAY_WEBHOOK_SECRET to environment variables
 * 2. Configure webhook URL in Razorpay Dashboard:
 *    https://yourdomain.com/api/razorpay/webhook
 * 3. Select events to receive (payment.captured, payment.failed, payment.refunded)
 * 
 * Testing:
 * - Use Razorpay test mode to send test webhooks
 * - Check payment_logs table for webhook attempts
 * - Verify order status updates correctly
 */

export async function POST(request: NextRequest) {
    try {
        // Get webhook secret from environment
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.error('[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET not configured');
            return NextResponse.json(
                { error: 'Webhook secret not configured' },
                { status: 500 }
            );
        }

        // Get signature from headers
        const signature = request.headers.get('x-razorpay-signature');

        if (!signature) {
            console.warn('[Razorpay Webhook] Missing signature header');
            return NextResponse.json(
                { error: 'Missing signature header' },
                { status: 400 }
            );
        }

        // Get raw body as text for signature verification
        const rawBody = await request.text();

        // Verify webhook signature
        const isValid = paymentService.verifyWebhookSignature(
            rawBody,
            signature,
            webhookSecret
        );

        if (!isValid) {
            console.warn('[Razorpay Webhook] Invalid signature', {
                signature,
                bodyLength: rawBody.length,
            });
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        // Parse webhook payload
        const webhookEvent = JSON.parse(rawBody);

        console.log('[Razorpay Webhook] Received event:', {
            event: webhookEvent.event,
            paymentId: webhookEvent.payload?.payment?.entity?.id,
            verified: isValid,
        });

        // Process webhook event
        await paymentService.processWebhookEvent(webhookEvent, isValid);

        // Return success response
        return NextResponse.json(
            { received: true, event: webhookEvent.event },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('[Razorpay Webhook] Error processing webhook:', error);

        // Return error response but with 200 status to prevent Razorpay retries
        // Razorpay considers non-2xx responses as failures and retries
        return NextResponse.json(
            {
                received: true,
                error: 'Internal error processing webhook',
                message: error?.message || 'Unknown error',
            },
            { status: 200 }
        );
    }
}

/**
 * Handle GET requests (for testing/verification)
 */
export async function GET() {
    return NextResponse.json(
        {
            service: 'Razorpay Webhook Handler',
            status: 'active',
            events: [
                'payment.captured',
                'payment.failed',
                'payment.refunded',
            ],
            configured: !!process.env.RAZORPAY_WEBHOOK_SECRET,
        },
        { status: 200 }
    );
}
