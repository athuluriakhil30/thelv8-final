import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, company, quantity, message } = body;

    // Validate required fields
    if (!name || !email || !phone || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send email to business
    const { data, error } = await resend.emails.send({
      from: 'THE LV8 Custom Orders <support@thelv8.com>',
      to: 'athuluriakhil@gmail.com',
      replyTo: email,
      subject: `New Custom Order Inquiry from ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #1c1917 0%, #44403c 100%);
                color: white;
                padding: 30px;
                border-radius: 8px 8px 0 0;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 400;
              }
              .content {
                background: #f5f5f4;
                padding: 30px;
                border-radius: 0 0 8px 8px;
              }
              .info-row {
                background: white;
                padding: 15px;
                margin-bottom: 12px;
                border-radius: 6px;
                border-left: 4px solid #1c1917;
              }
              .label {
                font-weight: 600;
                color: #57534e;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 5px;
              }
              .value {
                color: #1c1917;
                font-size: 16px;
              }
              .message-box {
                background: white;
                padding: 20px;
                margin-top: 12px;
                border-radius: 6px;
                border-left: 4px solid #1c1917;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 2px solid #e7e5e4;
                color: #78716c;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🎨 New Custom Order Inquiry</h1>
            </div>
            
            <div class="content">
              <div class="info-row">
                <div class="label">Customer Name</div>
                <div class="value">${name}</div>
              </div>

              <div class="info-row">
                <div class="label">Email Address</div>
                <div class="value">${email}</div>
              </div>

              <div class="info-row">
                <div class="label">Phone Number</div>
                <div class="value">${phone}</div>
              </div>

              ${company ? `
              <div class="info-row">
                <div class="label">Company/Brand Name</div>
                <div class="value">${company}</div>
              </div>
              ` : ''}

              ${quantity ? `
              <div class="info-row">
                <div class="label">Estimated Quantity</div>
                <div class="value">${quantity}</div>
              </div>
              ` : ''}

              <div class="message-box">
                <div class="label">Project Details</div>
                <div class="value" style="white-space: pre-wrap; margin-top: 10px;">${message}</div>
              </div>

              <div class="footer">
                <p><strong>Action Required:</strong> Respond to this inquiry within 24 hours.</p>
                <p>Reply directly to this email to contact ${name} at ${email}</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Quote request sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Custom order API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
