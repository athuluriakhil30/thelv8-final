import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/services/payment.service';

// Disable body parsing to get raw body for signature verification
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    const requestId = `wh_${Date.now()}`;
    console.log(`[Razorpay Webhook ${requestId}] ========== NEW WEBHOOK RECEIVED ==========`);
    
    try {
        // Get webhook secret from environment
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.error(`[Razorpay Webhook ${requestId}] RAZORPAY_WEBHOOK_SECRET not configured`);
            return NextResponse.json(
                { error: 'Webhook secret not configured' },
                { status: 500 }
            );
        }

        // Get signature from headers
        const signature = request.headers.get('x-razorpay-signature');

        if (!signature) {
            console.warn(`[Razorpay Webhook ${requestId}] Missing signature header`);
            return NextResponse.json(
                { error: 'Missing signature header' },
                { status: 400 }
            );
        }

        // Get raw body as text for signature verification
        const rawBody = await request.text();
        console.log(`[Razorpay Webhook ${requestId}] Body length: ${rawBody.length} bytes`);

        // Verify webhook signature
        const isValid = paymentService.verifyWebhookSignature(
            rawBody,
            signature,
            webhookSecret
        );

        console.log(`[Razorpay Webhook ${requestId}] Signature verification: ${isValid ? 'VALID' : 'INVALID'}`);

        if (!isValid) {
            console.warn(`[Razorpay Webhook ${requestId}] Invalid signature - REJECTING`);
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        // Parse webhook payload
        const webhookEvent = JSON.parse(rawBody);

        console.log(`[Razorpay Webhook ${requestId}] Event details:`, {
            event: webhookEvent.event,
            paymentId: webhookEvent.payload?.payment?.entity?.id,
            orderId: webhookEvent.payload?.payment?.entity?.order_id,
            amount: webhookEvent.payload?.payment?.entity?.amount,
            status: webhookEvent.payload?.payment?.entity?.status,
            verified: isValid,
        });

        // Process webhook event
        console.log(`[Razorpay Webhook ${requestId}] Processing event...`);
        await paymentService.processWebhookEvent(webhookEvent, isValid);
        console.log(`[Razorpay Webhook ${requestId}] Event processed successfully`);

        // Return success response
        return NextResponse.json(
            { received: true, event: webhookEvent.event, requestId },
            { status: 200 }
        );
    } catch (error: any) {
        console.error(`[Razorpay Webhook ${requestId}] ========== ERROR ==========`);
        console.error(`[Razorpay Webhook ${requestId}] Error type:`, error?.constructor?.name);
        console.error(`[Razorpay Webhook ${requestId}] Error message:`, error?.message);
        console.error(`[Razorpay Webhook ${requestId}] Error stack:`, error?.stack);

        // Return error response but with 200 status to prevent Razorpay retries
        // Razorpay considers non-2xx responses as failures and retries
        return NextResponse.json(
            {
                received: true,
                error: 'Internal error processing webhook',
                message: error?.message || 'Unknown error',
                requestId,
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

/**
 * Handle OPTIONS requests (CORS preflight)
 */
export async function OPTIONS() {
    return NextResponse.json(
        { message: 'OK' },
        { 
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, x-razorpay-signature',
            }
        }
    );
}
