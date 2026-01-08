/**
 * Client-side email helper
 * Sends emails via the API route
 */

interface EmailData {
  type: 'order_confirmation' | 'order_status_update' | 'order_shipped' | 'order_delivered' | 'order_cancelled';
  data: any;
}

export const emailClient = {
  async sendEmail(emailData: EmailData) {
    try {
      // Use absolute URL if on server, relative if in browser
      const baseUrl = typeof window === 'undefined' 
        ? (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
        : '';
      
      const response = await fetch(`${baseUrl}/api/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      return result;
    } catch (error) {
      console.error('Email client error:', error);
      throw error;
    }
  },

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(data: {
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
    return this.sendEmail({
      type: 'order_confirmation',
      data,
    });
  },

  /**
   * Send order status update email
   */
  async sendOrderStatusUpdate(data: {
    to: string;
    customerName: string;
    orderNumber: string;
    orderId: string;
    status: string;
    statusMessage: string;
    trackingNumber?: string;
  }) {
    return this.sendEmail({
      type: 'order_status_update',
      data,
    });
  },

  /**
   * Send order shipped email
   */
  async sendOrderShipped(data: {
    to: string;
    customerName: string;
    orderNumber: string;
    orderId: string;
    trackingNumber?: string;
    trackingUrl?: string;
    estimatedDelivery?: string;
  }) {
    return this.sendEmail({
      type: 'order_shipped',
      data,
    });
  },

  /**
   * Send order delivered email
   */
  async sendOrderDelivered(data: {
    to: string;
    customerName: string;
    orderNumber: string;
    orderId: string;
  }) {
    return this.sendEmail({
      type: 'order_delivered',
      data,
    });
  },

  /**
   * Send order cancelled email
   */
  async sendOrderCancelled(data: {
    to: string;
    customerName: string;
    orderNumber: string;
    orderId: string;
    reason?: string;
    refundAmount?: number;
  }) {
    return this.sendEmail({
      type: 'order_cancelled',
      data,
    });
  },
};
