'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Shield } from 'lucide-react';

interface SignupModalProps {
  open: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

type SignupStep = 'details' | 'otp';

export function SignupModal({ open, onClose, onSwitchToLogin }: SignupModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<SignupStep>('details');
  const [otpCode, setOtpCode] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const { signUp } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.fullName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your full name',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Send OTP to email
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email,
          purpose: 'signup'
        }),
      });

      const data = await response.json();

      if (!data.success) {
        toast({
          title: 'Error',
          description: data.message || 'Failed to send OTP',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'OTP sent to your email!',
      });
      setStep('otp');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to send OTP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpCode || otpCode.length !== 6) {
      toast({
        title: 'Error',
        description: 'Please enter a valid 6-digit OTP',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Verify OTP first
      const verifyResponse = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otpCode: otpCode,
          purpose: 'signup'
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyData.success) {
        toast({
          title: 'Error',
          description: verifyData.message || 'Invalid OTP',
          variant: 'destructive',
        });
        return;
      }

      // OTP verified, proceed with signup
      await signUp(formData.email, formData.password, formData.fullName);
      
      toast({
        title: 'Success',
        description: 'Account created successfully!',
      });
      onClose();
      
      // Reset form
      setFormData({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
      setOtpCode('');
      setStep('details');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create account',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendDisabled) return;

    setResendDisabled(true);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email,
          purpose: 'signup'
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'New OTP sent to your email!',
        });
        setOtpCode('');
        
        // Re-enable after 60 seconds
        setTimeout(() => setResendDisabled(false), 60000);
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to resend OTP',
          variant: 'destructive',
        });
        setResendDisabled(false);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resend OTP',
        variant: 'destructive',
      });
      setResendDisabled(false);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('details');
    setOtpCode('');
  };

  const handleSubmit = step === 'details' ? handleInitialSubmit : handleOTPVerification;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'details' ? 'Create Account' : 'Verify Your Email'}
          </DialogTitle>
          <DialogDescription>
            {step === 'details' 
              ? 'Sign up to start shopping with thelv8'
              : 'Enter the OTP code sent to your email'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'details' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <p className="text-xs text-center text-stone-500 pt-2">
              By signing up, you agree to our{' '}
              <a 
                href="/privacy-policy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-stone-700 hover:text-stone-900 underline font-medium"
              >
                Privacy Policy
              </a>
              {' '}and{' '}
              <a 
                href="/terms-conditions" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-stone-700 hover:text-stone-900 underline font-medium"
              >
                Terms of Service
              </a>
            </p>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Continue with Email Verification
                </>
              )}
            </Button>

            <div className="text-center text-sm">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-stone-900 font-medium hover:underline"
              >
                Sign in
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-amber-600" />
              </div>
            </div>

            <p className="text-center text-sm text-stone-600 mb-4">
              We've sent a 6-digit verification code to<br />
              <strong className="text-stone-900">{formData.email}</strong>
            </p>

            <div>
              <Label htmlFor="otpCode">Enter OTP Code</Label>
              <Input
                id="otpCode"
                type="text"
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                disabled={loading}
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
                autoComplete="off"
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800 text-center">
                ⏰ OTP expires in 10 minutes
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || otpCode.length !== 6}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Create Account'
              )}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={handleBack}
                className="text-stone-600 hover:text-stone-900"
                disabled={loading}
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleResendOTP}
                className="text-amber-700 hover:text-amber-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || resendDisabled}
              >
                {resendDisabled ? 'Resend in 60s' : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
