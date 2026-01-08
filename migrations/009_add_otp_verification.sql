-- Migration: Add OTP Verification System
-- Date: 2026-01-05
-- Description: Creates OTP verification table for signup email verification

-- 1. Create otp_verifications table
CREATE TABLE IF NOT EXISTS public.otp_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    purpose VARCHAR(20) NOT NULL CHECK (purpose IN ('signup', 'password_reset', 'login')),
    verified BOOLEAN DEFAULT false,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    ip_address TEXT,
    user_agent TEXT
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_otp_email ON public.otp_verifications(email);
CREATE INDEX IF NOT EXISTS idx_otp_code ON public.otp_verifications(otp_code);
CREATE INDEX IF NOT EXISTS idx_otp_purpose ON public.otp_verifications(purpose);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON public.otp_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_verified ON public.otp_verifications(verified);

-- 3. Enable Row Level Security
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies - Only backend service can access OTP table
-- No direct client access for security
CREATE POLICY "Service role can manage OTP verifications" 
ON public.otp_verifications FOR ALL 
USING (auth.role() = 'service_role');

-- 5. Function to clean up expired OTPs (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
    DELETE FROM public.otp_verifications
    WHERE expires_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function to generate and store OTP
CREATE OR REPLACE FUNCTION generate_otp(
    p_email TEXT,
    p_purpose VARCHAR(20),
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE(
    otp_code VARCHAR(6),
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_otp_code VARCHAR(6);
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Generate 6-digit OTP
    v_otp_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Set expiry time (10 minutes from now)
    v_expires_at := NOW() + INTERVAL '10 minutes';
    
    -- Invalidate any existing unverified OTPs for this email and purpose
    UPDATE public.otp_verifications
    SET verified = false
    WHERE email = p_email 
      AND purpose = p_purpose 
      AND verified = false
      AND otp_verifications.expires_at > NOW();
    
    -- Insert new OTP
    INSERT INTO public.otp_verifications (
        email,
        otp_code,
        purpose,
        expires_at,
        ip_address,
        user_agent
    ) VALUES (
        p_email,
        v_otp_code,
        p_purpose,
        v_expires_at,
        p_ip_address,
        p_user_agent
    );
    
    RETURN QUERY SELECT v_otp_code AS otp_code, v_expires_at AS expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function to verify OTP
CREATE OR REPLACE FUNCTION verify_otp(
    p_email TEXT,
    p_otp_code VARCHAR(6),
    p_purpose VARCHAR(20)
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_otp_record RECORD;
BEGIN
    -- Find the OTP record
    SELECT * INTO v_otp_record
    FROM public.otp_verifications
    WHERE email = p_email
      AND otp_code = p_otp_code
      AND purpose = p_purpose
      AND verified = false
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Check if OTP exists
    IF v_otp_record IS NULL THEN
        RETURN QUERY SELECT false, 'Invalid OTP code'::TEXT;
        RETURN;
    END IF;
    
    -- Check if OTP is expired
    IF v_otp_record.expires_at < NOW() THEN
        RETURN QUERY SELECT false, 'OTP has expired'::TEXT;
        RETURN;
    END IF;
    
    -- Check max attempts
    IF v_otp_record.attempts >= v_otp_record.max_attempts THEN
        RETURN QUERY SELECT false, 'Maximum verification attempts exceeded'::TEXT;
        RETURN;
    END IF;
    
    -- Mark as verified
    UPDATE public.otp_verifications
    SET verified = true,
        verified_at = NOW()
    WHERE id = v_otp_record.id;
    
    RETURN QUERY SELECT true, 'OTP verified successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Function to increment failed attempt
CREATE OR REPLACE FUNCTION increment_otp_attempt(
    p_email TEXT,
    p_otp_code VARCHAR(6),
    p_purpose VARCHAR(20)
)
RETURNS void AS $$
BEGIN
    UPDATE public.otp_verifications
    SET attempts = attempts + 1
    WHERE email = p_email
      AND otp_code = p_otp_code
      AND purpose = p_purpose
      AND verified = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Add email_verified column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- 10. Create index on email_verified
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified 
ON public.profiles(email_verified);

COMMENT ON TABLE public.otp_verifications IS 'Stores OTP codes for email verification and authentication';
COMMENT ON FUNCTION generate_otp IS 'Generates a new 6-digit OTP code and stores it';
COMMENT ON FUNCTION verify_otp IS 'Verifies an OTP code and marks it as used';
COMMENT ON FUNCTION cleanup_expired_otps IS 'Removes expired OTP records older than 24 hours';
