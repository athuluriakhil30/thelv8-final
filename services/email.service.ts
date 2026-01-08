import { Resend } from 'resend';

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'The LV8 <orders@thelv8.com>',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@thelv8.com',
};

// Check if email service is configured
const isEmailConfigured = !!process.env.RESEND_API_KEY;

if (!isEmailConfigured) {
  console.warn('⚠️  Email service not configured: RESEND_API_KEY is missing. Emails will not be sent.');
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export const emailService = {
  /**
   * Send email using Resend
   */
  async sendEmail(options: EmailOptions) {
    // Gracefully skip if email not configured
    if (!isEmailConfigured) {
      console.warn('Email not sent (service not configured):', options.subject);
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const { data, error } = await resend.emails.send({
        from: EMAIL_CONFIG.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        replyTo: options.replyTo || EMAIL_CONFIG.replyTo,
      });

      if (error) {
        console.error('Email send error:', error);
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  },

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(params: {
    to: string;
    customerName: string;
    orderNumber: string;
    orderId: string;
    orderDate: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      size?: string;
    }>;
    subtotal: number;
    shippingCharge: number;
    tax: number;
    discount: number;
    total: number;
    shippingAddress: {
      full_name: string;
      phone: string;
      address_line1: string;
      address_line2?: string;
      city: string;
      state: string;
      pincode: string;
    };
    paymentMethod: string;
  }) {
    const html = generateOrderConfirmationEmail(params);
    
    return this.sendEmail({
      to: params.to,
      subject: `Order Confirmed - #${params.orderNumber}`,
      html,
    });
  },

  /**
   * Send order status update email
   */
  async sendOrderStatusUpdate(params: {
    to: string;
    customerName: string;
    orderNumber: string;
    orderId: string;
    status: string;
    statusMessage: string;
    trackingNumber?: string;
  }) {
    const html = generateOrderStatusEmail(params);
    
    return this.sendEmail({
      to: params.to,
      subject: `Order Update - #${params.orderNumber}`,
      html,
    });
  },

  /**
   * Send order shipped email
   */
  async sendOrderShipped(params: {
    to: string;
    customerName: string;
    orderNumber: string;
    orderId: string;
    trackingNumber?: string;
    trackingUrl?: string;
    estimatedDelivery?: string;
  }) {
    const html = generateOrderShippedEmail(params);
    
    return this.sendEmail({
      to: params.to,
      subject: `Your Order Has Been Shipped - #${params.orderNumber}`,
      html,
    });
  },

  /**
   * Send order delivered email
   */
  async sendOrderDelivered(params: {
    to: string;
    customerName: string;
    orderNumber: string;
    orderId: string;
  }) {
    const html = generateOrderDeliveredEmail(params);
    
    return this.sendEmail({
      to: params.to,
      subject: `Your Order Has Been Delivered - #${params.orderNumber}`,
      html,
    });
  },

  /**
   * Send order cancellation email
   */
  async sendOrderCancelled(params: {
    to: string;
    customerName: string;
    orderNumber: string;
    orderId: string;
    reason?: string;
    refundAmount?: number;
  }) {
    const html = generateOrderCancelledEmail(params);
    
    return this.sendEmail({
      to: params.to,
      subject: `Order Cancelled - #${params.orderNumber}`,
      html,
    });
  },

  /**
   * Send OTP verification email
   */
  async sendOTPEmail(params: {
    to: string;
    otpCode: string;
    purpose: 'signup' | 'password_reset' | 'login';
    expiresInMinutes?: number;
  }) {
    const { to, otpCode, purpose, expiresInMinutes = 10 } = params;

    const purposeText = {
      signup: 'Sign Up Verification',
      password_reset: 'Password Reset',
      login: 'Login Verification',
    }[purpose];

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 300;">the<span style="font-weight: 600; font-style: italic;">lv8</span></h1>
              <div style="margin-top: 20px; color: #ffffff; font-size: 24px; font-weight: 500;">${purposeText}</div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Hello,
              </p>
              <p style="margin: 0 0 30px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Use the verification code below to complete your ${purpose.replace('_', ' ')}:
              </p>

              <!-- OTP Code Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border-radius: 12px; padding: 24px; display: inline-block;">
                      <p style="margin: 0 0 8px; color: #78350f; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
                      <p style="margin: 0; color: #1f2937; font-size: 42px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otpCode}</p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Expiration Warning -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 30px 0;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                      ⏰ This code will expire in <strong>${expiresInMinutes} minutes</strong>. Please use it soon.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Security Tips -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <p style="margin: 0 0 12px; color: #1f2937; font-size: 14px; font-weight: 600;">Security Tips:</p>
                <ul style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 14px; line-height: 1.8;">
                  <li>Never share this code with anyone</li>
                  <li>Our team will never ask for your verification code</li>
                  <li>If you didn't request this code, please ignore this email</li>
                </ul>
              </div>

              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                Need help? Contact us at <a href="mailto:support@thelv8.com" style="color: #f59e0b; text-decoration: none;">support@thelv8.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">This is an automated message from The LV8</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">© 2025 The LV8. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const result = await this.sendEmail({
      to,
      subject: `${purposeText} - The LV8`,
      html,
    });

    return result.success;
  },
};

/**
 * Generate order confirmation email HTML
 */
function generateOrderConfirmationEmail(params: Parameters<typeof emailService.sendOrderConfirmation>[0]): string {
  const itemsHtml = params.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <div style="font-weight: 500; color: #1f2937;">${item.name}</div>
        ${item.size ? `<div style="font-size: 14px; color: #6b7280;">Size: ${item.size}</div>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${item.price.toLocaleString('en-IN')}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 500;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 300;">the<span style="font-weight: 600; font-style: italic;">lv8</span></h1>
              <div style="margin-top: 20px; color: #ffffff; font-size: 24px; font-weight: 500;">Order Confirmed! 🎉</div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Hi <strong>${params.customerName}</strong>,
              </p>
              <p style="margin: 0 0 30px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Thank you for your order! We're excited to let you know that we've received your order and it's being processed.
              </p>

              <!-- Order Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Order Number</span><br>
                          <strong style="color: #1f2937; font-size: 18px;">#${params.orderNumber}</strong>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <span style="color: #6b7280; font-size: 14px;">Order Date</span><br>
                          <strong style="color: #1f2937; font-size: 16px;">${params.orderDate}</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Order Items -->
              <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 20px; font-weight: 600;">Order Items</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 30px;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px; text-align: left; color: #6b7280; font-weight: 600; font-size: 14px;">Product</th>
                    <th style="padding: 12px; text-align: center; color: #6b7280; font-weight: 600; font-size: 14px;">Qty</th>
                    <th style="padding: 12px; text-align: right; color: #6b7280; font-weight: 600; font-size: 14px;">Price</th>
                    <th style="padding: 12px; text-align: right; color: #6b7280; font-weight: 600; font-size: 14px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Order Summary -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Subtotal</td>
                  <td style="padding: 8px 0; text-align: right; color: #1f2937;">₹${params.subtotal.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Shipping</td>
                  <td style="padding: 8px 0; text-align: right; color: #1f2937;">₹${params.shippingCharge.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">GST</td>
                  <td style="padding: 8px 0; text-align: right; color: #1f2937;">₹${params.tax.toLocaleString('en-IN')}</td>
                </tr>
                ${params.discount > 0 ? `
                <tr>
                  <td style="padding: 8px 0; color: #059669;">Discount</td>
                  <td style="padding: 8px 0; text-align: right; color: #059669;">-₹${params.discount.toLocaleString('en-IN')}</td>
                </tr>
                ` : ''}
                <tr style="border-top: 2px solid #e5e7eb;">
                  <td style="padding: 12px 0 0; color: #1f2937; font-size: 18px; font-weight: 600;">Total</td>
                  <td style="padding: 12px 0 0; text-align: right; color: #1f2937; font-size: 18px; font-weight: 600;">₹${params.total.toLocaleString('en-IN')}</td>
                </tr>
              </table>

              <!-- Shipping Address -->
              <h2 style="margin: 0 0 15px; color: #1f2937; font-size: 20px; font-weight: 600;">Shipping Address</h2>
              <div style="padding: 20px; background-color: #f9fafb; border-radius: 8px; margin-bottom: 30px;">
                <p style="margin: 0 0 5px; color: #1f2937; font-weight: 500;">${params.shippingAddress.full_name}</p>
                <p style="margin: 0 0 5px; color: #6b7280;">${params.shippingAddress.phone}</p>
                <p style="margin: 0 0 5px; color: #6b7280;">${params.shippingAddress.address_line1}</p>
                ${params.shippingAddress.address_line2 ? `<p style="margin: 0 0 5px; color: #6b7280;">${params.shippingAddress.address_line2}</p>` : ''}
                <p style="margin: 0; color: #6b7280;">${params.shippingAddress.city}, ${params.shippingAddress.state} - ${params.shippingAddress.pincode}</p>
              </div>

              <!-- Payment Method -->
              <h2 style="margin: 0 0 15px; color: #1f2937; font-size: 20px; font-weight: 600;">Payment Method</h2>
              <div style="padding: 15px 20px; background-color: #f9fafb; border-radius: 8px; margin-bottom: 30px;">
                <p style="margin: 0; color: #1f2937; font-weight: 500;">${params.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
              </div>

              <!-- Track Order Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://thelv8.com'}/account/orders/${params.orderId}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Track Your Order</a>
                  </td>
                </tr>
              </table>

              <!-- Support -->
              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If you have any questions about your order, please contact us at <a href="mailto:support@thelv8.com" style="color: #f59e0b; text-decoration: none;">support@thelv8.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">Thank you for shopping with us!</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">© 2025 The LV8. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Generate order status update email HTML
 */
function generateOrderStatusEmail(params: Parameters<typeof emailService.sendOrderStatusUpdate>[0]): string {
  const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    processing: '#3b82f6',
    shipped: '#8b5cf6',
    delivered: '#10b981',
    cancelled: '#ef4444',
  };

  const statusColor = statusColors[params.status] || '#6b7280';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Status Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #1f2937; padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 300;">the<span style="font-weight: 600; font-style: italic;">lv8</span></h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Hi <strong>${params.customerName}</strong>,
              </p>

              <!-- Status Badge -->
              <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; padding: 12px 24px; background-color: ${statusColor}; color: #ffffff; border-radius: 24px; font-weight: 600; font-size: 18px; text-transform: capitalize;">
                  ${params.status}
                </div>
              </div>

              <p style="margin: 0 0 30px; color: #1f2937; font-size: 16px; line-height: 1.6; text-align: center;">
                ${params.statusMessage}
              </p>

              <!-- Order Number -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <span style="color: #6b7280; font-size: 14px;">Order Number</span><br>
                    <strong style="color: #1f2937; font-size: 20px;">#${params.orderNumber}</strong>
                  </td>
                </tr>
              </table>

              ${params.trackingNumber ? `
              <!-- Tracking Number -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <span style="color: #1e40af; font-size: 14px;">Tracking Number</span><br>
                    <strong style="color: #1e3a8a; font-size: 18px; font-family: monospace;">${params.trackingNumber}</strong>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- View Order Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://thelv8.com'}/account/orders/${params.orderId}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">View Order Details</a>
                  </td>
                </tr>
              </table>

              <!-- Support -->
              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                Questions? Contact us at <a href="mailto:support@thelv8.com" style="color: #f59e0b; text-decoration: none;">support@thelv8.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">Thank you for shopping with us!</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">© 2025 The LV8. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Generate order shipped email HTML
 */
function generateOrderShippedEmail(params: Parameters<typeof emailService.sendOrderShipped>[0]): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Shipped</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 300;">the<span style="font-weight: 600; font-style: italic;">lv8</span></h1>
              <div style="margin-top: 20px; color: #ffffff; font-size: 24px; font-weight: 500;">📦 Your Order is On Its Way!</div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Hi <strong>${params.customerName}</strong>,
              </p>
              <p style="margin: 0 0 30px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Great news! Your order has been shipped and is on its way to you. We hope you're as excited as we are!
              </p>

              <!-- Order Number -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <span style="color: #6b7280; font-size: 14px;">Order Number</span><br>
                    <strong style="color: #1f2937; font-size: 20px;">#${params.orderNumber}</strong>
                  </td>
                </tr>
              </table>

              ${params.trackingNumber ? `
              <!-- Tracking Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 24px;">
                    <div style="text-align: center; margin-bottom: 12px;">
                      <span style="color: #1e40af; font-size: 14px; font-weight: 600;">TRACKING NUMBER</span><br>
                      <strong style="color: #1e3a8a; font-size: 20px; font-family: monospace; letter-spacing: 1px;">${params.trackingNumber}</strong>
                    </div>
                    ${params.trackingUrl ? `
                    <div style="text-align: center; margin-top: 16px;">
                      <a href="${params.trackingUrl}" style="display: inline-block; padding: 10px 24px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Track Shipment</a>
                    </div>
                    ` : ''}
                  </td>
                </tr>
              </table>
              ` : ''}

              ${params.estimatedDelivery ? `
              <!-- Estimated Delivery -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <span style="color: #15803d; font-size: 14px;">Estimated Delivery</span><br>
                    <strong style="color: #166534; font-size: 18px;">${params.estimatedDelivery}</strong>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- View Order Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://thelv8.com'}/account/orders/${params.orderId}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">View Order Details</a>
                  </td>
                </tr>
              </table>

              <!-- Support -->
              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                Need help? Contact us at <a href="mailto:support@thelv8.com" style="color: #f59e0b; text-decoration: none;">support@thelv8.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">Thank you for shopping with us!</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">© 2025 The LV8. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Generate order delivered email HTML
 */
function generateOrderDeliveredEmail(params: Parameters<typeof emailService.sendOrderDelivered>[0]): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Delivered</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 300;">the<span style="font-weight: 600; font-style: italic;">lv8</span></h1>
              <div style="margin-top: 20px; color: #ffffff; font-size: 24px; font-weight: 500;">🎉 Order Delivered Successfully!</div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Hi <strong>${params.customerName}</strong>,
              </p>
              <p style="margin: 0 0 30px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Wonderful! Your order has been successfully delivered. We hope you love your purchase!
              </p>

              <!-- Order Number -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <span style="color: #065f46; font-size: 14px;">Order Number</span><br>
                    <strong style="color: #064e3b; font-size: 24px;">#${params.orderNumber}</strong>
                  </td>
                </tr>
              </table>

              <!-- Feedback Section -->
              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
                <p style="margin: 0 0 10px; color: #92400e; font-weight: 600; font-size: 16px;">How was your experience?</p>
                <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
                  We'd love to hear your feedback! Your reviews help us improve and help other customers make informed decisions.
                </p>
              </div>

              <!-- Action Buttons -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://thelv8.com'}/account/orders/${params.orderId}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 0 5px;">View Order</a>
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://thelv8.com'}/shop" style="display: inline-block; padding: 14px 32px; background-color: #ffffff; color: #f59e0b; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; border: 2px solid #f59e0b; margin: 0 5px;">Shop Again</a>
                  </td>
                </tr>
              </table>

              <!-- Support -->
              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                Any issues with your order? Contact us at <a href="mailto:support@thelv8.com" style="color: #f59e0b; text-decoration: none;">support@thelv8.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">Thank you for shopping with us!</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">© 2025 The LV8. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Generate order cancelled email HTML
 */
function generateOrderCancelledEmail(params: Parameters<typeof emailService.sendOrderCancelled>[0]): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Cancelled</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #1f2937; padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 300;">the<span style="font-weight: 600; font-style: italic;">lv8</span></h1>
              <div style="margin-top: 20px; color: #ffffff; font-size: 24px; font-weight: 500;">Order Cancelled</div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Hi <strong>${params.customerName}</strong>,
              </p>
              <p style="margin: 0 0 30px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Your order #${params.orderNumber} has been cancelled.
              </p>

              ${params.reason ? `
              <!-- Cancellation Reason -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px; color: #991b1b; font-weight: 600; font-size: 14px;">Cancellation Reason</p>
                    <p style="margin: 0; color: #7f1d1d; font-size: 14px; line-height: 1.6;">${params.reason}</p>
                  </td>
                </tr>
              </table>
              ` : ''}

              ${params.refundAmount ? `
              <!-- Refund Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <span style="color: #1e40af; font-size: 14px;">Refund Amount</span><br>
                    <strong style="color: #1e3a8a; font-size: 24px;">₹${params.refundAmount.toLocaleString('en-IN')}</strong>
                    <p style="margin: 10px 0 0; color: #1e40af; font-size: 13px;">
                      The refund will be processed within 5-7 business days
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <p style="margin: 0 0 30px; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                We're sorry to see you go. If you have any concerns or questions, please don't hesitate to reach out to us.
              </p>

              <!-- Continue Shopping Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://thelv8.com'}/shop" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Continue Shopping</a>
                  </td>
                </tr>
              </table>

              <!-- Support -->
              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                Have questions? Contact us at <a href="mailto:support@thelv8.com" style="color: #f59e0b; text-decoration: none;">support@thelv8.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">We hope to see you again soon!</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">© 2025 The LV8. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export default emailService;
