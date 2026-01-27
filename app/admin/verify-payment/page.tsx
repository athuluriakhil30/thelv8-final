'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface VerificationResult {
  success: boolean;
  message: string;
  order?: {
    id: string;
    order_number: string;
    payment_status: string;
    payment_id?: string;
    status: string;
  };
  payment?: {
    id: string;
    amount: number;
    method: string;
    status: string;
  };
  payments?: Array<{
    id: string;
    status: string;
    method: string;
    amount: number;
  }>;
  recommendation?: string;
  error?: string;
}

export default function PaymentVerificationPage() {
  const [orderId, setOrderId] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleVerify = async () => {
    if (!orderId.trim()) {
      setResult({
        success: false,
        message: 'Please enter an Order ID',
        error: 'Order ID is required',
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Get auth token from Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Not authenticated. Please login first.');
      }

      const accessToken = session.access_token;
      
      if (!accessToken) {
        throw new Error('Invalid auth token. Please login again.');
      }

      const response = await fetch('/api/razorpay/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          orderId: orderId.trim(),
          paymentId: paymentId.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({
          success: false,
          message: data.error || 'Verification failed',
          error: data.error,
          ...data,
        });
      } else {
        setResult(data);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setResult({
        success: false,
        message: 'An unexpected error occurred',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Payment Verification Tool</h1>
          <p className="text-stone-600">
            Manually verify payment status when webhooks fail or Razorpay returns errors
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Verify Payment</CardTitle>
            <CardDescription>
              Enter the Order ID to check payment status and automatically update if payment was captured.
              Optionally provide the Payment ID for additional verification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="orderId">Order ID (UUID) *</Label>
                <Input
                  id="orderId"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g., 4b827752-8b93-4600-97df-dbebd6a8911c"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-stone-500 mt-1">
                  Get this from database or order URL
                </p>
              </div>

              <div>
                <Label htmlFor="paymentId">Payment ID (Optional)</Label>
                <Input
                  id="paymentId"
                  value={paymentId}
                  onChange={(e) => setPaymentId(e.target.value)}
                  placeholder="e.g., pay_S93Y0v8cFh6N9o"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-stone-500 mt-1">
                  The payment ID received from Razorpay (if known)
                </p>
              </div>

              <Button
                onClick={handleVerify}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Payment'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card className={result.success ? 'border-green-500' : 'border-red-500'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    Verification Successful
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-600" />
                    Verification Failed
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>

              {result.order && (
                <div className="bg-stone-100 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Order Details</h3>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-stone-600">Order Number:</dt>
                    <dd className="font-mono">{result.order.order_number}</dd>
                    
                    <dt className="text-stone-600">Payment Status:</dt>
                    <dd className="font-semibold">
                      <span className={
                        result.order.payment_status === 'paid' 
                          ? 'text-green-600' 
                          : result.order.payment_status === 'failed'
                          ? 'text-red-600'
                          : 'text-amber-600'
                      }>
                        {result.order.payment_status.toUpperCase()}
                      </span>
                    </dd>
                    
                    <dt className="text-stone-600">Order Status:</dt>
                    <dd className="font-semibold">{result.order.status}</dd>
                    
                    {result.order.payment_id && (
                      <>
                        <dt className="text-stone-600">Payment ID:</dt>
                        <dd className="font-mono text-xs">{result.order.payment_id}</dd>
                      </>
                    )}
                  </dl>
                </div>
              )}

              {result.payment && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold mb-2 text-green-800">Captured Payment Found</h3>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-green-700">Payment ID:</dt>
                    <dd className="font-mono">{result.payment.id}</dd>
                    
                    <dt className="text-green-700">Amount:</dt>
                    <dd className="font-semibold">₹{(result.payment.amount / 100).toFixed(2)}</dd>
                    
                    <dt className="text-green-700">Method:</dt>
                    <dd>{result.payment.method}</dd>
                    
                    <dt className="text-green-700">Status:</dt>
                    <dd className="font-semibold text-green-600">
                      {result.payment.status.toUpperCase()}
                    </dd>
                  </dl>
                </div>
              )}

              {result.payments && result.payments.length > 0 && (
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <h3 className="font-semibold mb-2 text-amber-800">
                    All Payments Found ({result.payments.length})
                  </h3>
                  <div className="space-y-2">
                    {result.payments.map((p, idx) => (
                      <div key={idx} className="bg-white p-2 rounded text-sm">
                        <div className="flex justify-between">
                          <span className="font-mono text-xs">{p.id}</span>
                          <span className={
                            p.status === 'captured' 
                              ? 'text-green-600 font-semibold' 
                              : p.status === 'failed'
                              ? 'text-red-600'
                              : 'text-amber-600'
                          }>
                            {p.status}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-stone-500 mt-1">
                          <span>{p.method}</span>
                          <span>₹{(p.amount / 100).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.recommendation && (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Recommendation:</strong> {result.recommendation}
                  </AlertDescription>
                </Alert>
              )}

              {result.error && (
                <Alert className="bg-red-50 border-red-200">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Error:</strong> {result.error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-stone-600">
            <ol className="list-decimal list-inside space-y-1">
              <li>Enter the Order ID (UUID) from your database or order URL</li>
              <li>Optionally enter the Payment ID if customer provided it</li>
              <li>Click "Verify Payment" to check status with Razorpay</li>
              <li>If payment was captured, order will be automatically updated</li>
              <li>If no payment found, you'll see recommendations for next steps</li>
            </ol>
            
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 mt-4">
              <p className="font-semibold text-amber-800 mb-1">⚠️ When to use this tool:</p>
              <ul className="list-disc list-inside space-y-1 text-amber-700">
                <li>Razorpay returns 500 Internal Server Error during checkout</li>
                <li>Customer completed payment but order status is still "pending"</li>
                <li>Webhook failed to process payment update</li>
                <li>Customer provides payment ID but order wasn't confirmed</li>
              </ul>
            </div>

            <div className="bg-green-50 p-3 rounded-lg border border-green-200 mt-4">
              <p className="font-semibold text-green-800 mb-1">✅ What this tool does:</p>
              <ul className="list-disc list-inside space-y-1 text-green-700">
                <li>Fetches real-time payment status from Razorpay API</li>
                <li>Automatically updates order status if payment is captured</li>
                <li>Sends confirmation email to customer on successful verification</li>
                <li>Provides detailed status report and recommendations</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
