/**
 * OTP Service Module
 * Handles OTP generation, verification, and email delivery
 * Modular and independent from core authentication
 */

import { supabaseAdmin } from '@/lib/supabase/server';

export interface OTPGenerateResult {
  success: boolean;
  message: string;
  expiresAt?: Date;
}

export interface OTPVerifyResult {
  success: boolean;
  message: string;
  verified?: boolean;
}

export interface OTPMetadata {
  ipAddress?: string;
  userAgent?: string;
}

export type OTPPurpose = 'signup' | 'password_reset' | 'login';

export const otpService = {
  /**
   * Generate OTP and store in database
   */
  async generateOTP(
    email: string,
    purpose: OTPPurpose = 'signup',
    metadata?: OTPMetadata
  ): Promise<OTPGenerateResult> {
    try {
      const { data, error } = await supabaseAdmin.rpc('generate_otp', {
        p_email: email.toLowerCase().trim(),
        p_purpose: purpose,
        p_ip_address: metadata?.ipAddress || undefined,
        p_user_agent: metadata?.userAgent || undefined,
      });

      if (error) {
        console.error('[OTPService] Error generating OTP:', error);
        return {
          success: false,
          message: 'Failed to generate OTP. Please try again.',
        };
      }

      if (!data || data.length === 0) {
        return {
          success: false,
          message: 'Failed to generate OTP.',
        };
      }

      const otpData = data[0];

      return {
        success: true,
        message: 'OTP generated successfully',
        expiresAt: new Date(otpData.expires_at),
      };
    } catch (error) {
      console.error('[OTPService] Exception generating OTP:', error);
      return {
        success: false,
        message: 'An error occurred while generating OTP.',
      };
    }
  },

  /**
   * Verify OTP code
   */
  async verifyOTP(
    email: string,
    otpCode: string,
    purpose: OTPPurpose = 'signup'
  ): Promise<OTPVerifyResult> {
    try {
      // Clean the OTP code
      const cleanOTP = otpCode.replace(/\s/g, '').trim();

      if (cleanOTP.length !== 6 || !/^\d{6}$/.test(cleanOTP)) {
        return {
          success: false,
          message: 'Invalid OTP format. Please enter 6 digits.',
          verified: false,
        };
      }

      const { data, error } = await supabaseAdmin.rpc('verify_otp', {
        p_email: email.toLowerCase().trim(),
        p_otp_code: cleanOTP,
        p_purpose: purpose,
      });

      if (error) {
        console.error('[OTPService] Error verifying OTP:', error);
        
        // Increment failed attempt
        await this.incrementAttempt(email, cleanOTP, purpose);
        
        return {
          success: false,
          message: 'Failed to verify OTP. Please try again.',
          verified: false,
        };
      }

      if (!data || data.length === 0) {
        await this.incrementAttempt(email, cleanOTP, purpose);
        return {
          success: false,
          message: 'Invalid OTP code.',
          verified: false,
        };
      }

      const result = data[0];

      if (!result.success) {
        await this.incrementAttempt(email, cleanOTP, purpose);
      }

      return {
        success: result.success,
        message: result.message,
        verified: result.success,
      };
    } catch (error) {
      console.error('[OTPService] Exception verifying OTP:', error);
      return {
        success: false,
        message: 'An error occurred while verifying OTP.',
        verified: false,
      };
    }
  },

  /**
   * Increment failed attempt counter
   */
  async incrementAttempt(
    email: string,
    otpCode: string,
    purpose: OTPPurpose
  ): Promise<void> {
    try {
      await supabaseAdmin.rpc('increment_otp_attempt', {
        p_email: email.toLowerCase().trim(),
        p_otp_code: otpCode,
        p_purpose: purpose,
      });
    } catch (error) {
      console.error('[OTPService] Error incrementing attempt:', error);
    }
  },

  /**
   * Get OTP from database (for email sending)
   */
  async getLatestOTP(
    email: string,
    purpose: OTPPurpose = 'signup'
  ): Promise<string | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('otp_verifications')
        .select('otp_code')
        .eq('email', email.toLowerCase().trim())
        .eq('purpose', purpose)
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return data.otp_code;
    } catch (error) {
      console.error('[OTPService] Error getting latest OTP:', error);
      return null;
    }
  },

  /**
   * Check if email has a valid unverified OTP
   */
  async hasValidOTP(
    email: string,
    purpose: OTPPurpose = 'signup'
  ): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin
        .from('otp_verifications')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .eq('purpose', purpose)
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString())
        .limit(1)
        .single();

      return !error && data !== null;
    } catch (error) {
      return false;
    }
  },

  /**
   * Mark email as verified in profiles table
   */
  async markEmailVerified(userId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ email_verified: true })
        .eq('id', userId);

      if (error) {
        console.error('[OTPService] Error marking email verified:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[OTPService] Exception marking email verified:', error);
      return false;
    }
  },

  /**
   * Clean up expired OTPs (should be called periodically)
   */
  async cleanupExpiredOTPs(): Promise<void> {
    try {
      await supabaseAdmin.rpc('cleanup_expired_otps');
    } catch (error) {
      console.error('[OTPService] Error cleaning up expired OTPs:', error);
    }
  },
};
