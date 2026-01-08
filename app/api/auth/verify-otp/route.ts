import { NextRequest, NextResponse } from 'next/server';
import { otpService } from '@/services/otp.service';

/**
 * API Route: Verify OTP
 * POST /api/auth/verify-otp
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otpCode, purpose = 'signup' } = body;

    // Validate inputs
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email address' },
        { status: 400 }
      );
    }

    if (!otpCode) {
      return NextResponse.json(
        { success: false, message: 'OTP code is required' },
        { status: 400 }
      );
    }

    // Verify OTP
    const result = await otpService.verifyOTP(email, otpCode, purpose);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: result.message,
          verified: false 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      verified: true,
    });
  } catch (error) {
    console.error('[API] Verify OTP error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while verifying OTP' },
      { status: 500 }
    );
  }
}
