import { NextRequest, NextResponse } from 'next/server';

// Force Node.js runtime
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    const diagnostics = {
      timestamp: new Date().toISOString(),
      runtime: 'nodejs',
      environment: process.env.NODE_ENV,
      razorpay: {
        keyId: keyId ? `${keyId.substring(0, 10)}...` : 'MISSING',
        keySecret: keySecret ? 'SET (hidden)' : 'MISSING',
        keyIdLength: keyId?.length || 0,
        keySecretLength: keySecret?.length || 0,
      },
      razorpayPackage: {
        available: false,
        version: 'unknown',
        error: null as string | null,
      }
    };

    // Try to load Razorpay package
    try {
      const Razorpay = require('razorpay');
      diagnostics.razorpayPackage.available = true;
      
      // Try to create instance
      if (keyId && keySecret) {
        const razorpay = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });
        diagnostics.razorpayPackage.version = 'Instance created successfully';
      }
    } catch (error) {
      diagnostics.razorpayPackage.error = error instanceof Error ? error.message : String(error);
    }

    return NextResponse.json(diagnostics);
  } catch (error) {
    return NextResponse.json({
      error: 'Diagnostic failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
