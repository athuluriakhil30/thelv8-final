import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

// Force Node.js runtime (Razorpay library doesn't work in Edge Runtime)
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = 'INR', receipt, notes } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Check if Razorpay is configured
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error('Razorpay credentials missing:', { 
        hasKeyId: !!keyId, 
        hasKeySecret: !!keySecret 
      });
      return NextResponse.json(
        { error: 'Razorpay not configured' },
        { status: 500 }
      );
    }

    // Initialize Razorpay instance inside the function
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // Create Razorpay order
    const options = {
      amount: Math.round(amount * 100), // amount in paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes || {},
    };

    console.log('Creating Razorpay order:', { 
      amount: options.amount, 
      currency, 
      receipt 
    });

    const razorpayOrder = await razorpay.orders.create(options);

    console.log('Razorpay order created successfully:', razorpayOrder.id);

    return NextResponse.json({
      success: true,
      order: razorpayOrder,
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    return NextResponse.json(
      { 
        error: 'Failed to create Razorpay order', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
