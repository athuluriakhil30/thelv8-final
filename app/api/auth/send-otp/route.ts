import { NextRequest, NextResponse } from 'next/server';
import { otpService } from '@/services/otp.service';
import { emailService } from '@/services/email.service';

/**
 * API Route: Send OTP for Email Verification
 * POST /api/auth/send-otp
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, purpose = 'signup' } = body;

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Get client metadata
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Generate OTP
    const result = await otpService.generateOTP(email, purpose, {
      ipAddress,
      userAgent,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 500 }
      );
    }

    // Get the generated OTP to send via email
    const otpCode = await otpService.getLatestOTP(email, purpose);

    if (!otpCode) {
      return NextResponse.json(
        { success: false, message: 'Failed to retrieve OTP' },
        { status: 500 }
      );
    }

    // Send OTP via email
    const emailSent = await emailService.sendOTPEmail({
      to: email,
      otpCode,
      purpose,
      expiresInMinutes: 10,
    });

    if (!emailSent) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to send OTP email. Please try again.' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully to your email',
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    console.error('[API] Send OTP error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while sending OTP' },
      { status: 500 }
    );
  }
}
