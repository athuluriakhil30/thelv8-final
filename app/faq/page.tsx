export default function FAQPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl md:text-5xl font-light text-stone-900 mb-8">
          Frequently Asked Questions
        </h1>

        <div className="prose prose-stone max-w-none">

          {/* SHOPPING INFORMATION */}
          <section className="mb-8">
            <h2 className="text-2xl font-medium text-stone-900 mb-4">
              Shopping Information
            </h2>

            <p className="text-stone-600 leading-relaxed mb-2">
              <strong>What is the shipping process and how long will it take?</strong>
            </p>
            <p className="text-stone-600 leading-relaxed mb-4">
              We offer free shipping across India for orders above ₹599. Orders are typically
              shipped within 3-5 working days and delivered within 2-10 working days (domestic).
              International delivery can take up to 10-15 working days.
            </p>

            <p className="text-stone-600 leading-relaxed mb-2">
              <strong>How much is the shipping cost?</strong>
            </p>
            <p className="text-stone-600 leading-relaxed mb-4">
              Shipping is free for orders above ₹599 within India. For international orders,
              shipping charges apply at checkout and may vary with bulk or special shipping.
            </p>

            <p className="text-stone-600 leading-relaxed mb-2">
              <strong>Can I track my order?</strong>
            </p>
            <p className="text-stone-600 leading-relaxed mb-4">
              Yes! Once your order ships, you’ll receive an email with tracking details so you
              can check its status online.
            </p>

            <p className="text-stone-600 leading-relaxed mb-2">
              <strong>What happens if my order is delayed?</strong>
            </p>
            <p className="text-stone-600 leading-relaxed">
              While we strive to meet delivery dates, occasional delays may happen due to
              circumstances beyond our control. You will be notified and can track your order.
            </p>
          </section>

          {/* PAYMENT INFORMATION */}
          <section className="mb-8">
            <h2 className="text-2xl font-medium text-stone-900 mb-4">
              Payment Information
            </h2>

            <p className="text-stone-600 leading-relaxed mb-2">
              <strong>What are the available payment methods?</strong>
            </p>
            <p className="text-stone-600 leading-relaxed mb-4">
              We accept UPI, debit/credit cards, and Cash on Delivery (COD) for orders above ₹599.
              All transactions are securely processed.
            </p>

            <p className="text-stone-600 leading-relaxed mb-2">
              <strong>Is my payment information secure?</strong>
            </p>
            <p className="text-stone-600 leading-relaxed mb-4">
              Yes — industry-standard encryption and secure payment gateways protect your data.
            </p>

            <p className="text-stone-600 leading-relaxed mb-2">
              <strong>Can I use a coupon or discount code?</strong>
            </p>
            <p className="text-stone-600 leading-relaxed mb-4">
              Yes — apply valid coupon codes at checkout. Discounts will reflect before payment.
            </p>

            <p className="text-stone-600 leading-relaxed">
              <strong>What is Cash on Delivery (COD)?</strong> COD is available for orders above
              ₹599 — pay in cash when your order is delivered.
            </p>
          </section>

          {/* ORDER RETURNS */}
          <section className="mb-8">
            <h2 className="text-2xl font-medium text-stone-900 mb-4">
              Order Returns
            </h2>

            <p className="text-stone-600 leading-relaxed mb-2">
              <strong>How do I return an order?</strong>
            </p>
            <p className="text-stone-600 leading-relaxed mb-4">
              Returns are accepted under conditions listed on the product page. After the return
              is processed, we'll issue a refund to your original payment method.
            </p>

            <p className="text-stone-600 leading-relaxed mb-2">
              <strong>Can I exchange an item instead of returning it?</strong>
            </p>
            <p className="text-stone-600 leading-relaxed mb-4">
              Yes — exchanges are possible for eligible products. Check the product page for details.
            </p>

            <p className="text-stone-600 leading-relaxed mb-2">
              <strong>How do I get a refund for my returned item?</strong>
            </p>
            <p className="text-stone-600 leading-relaxed mb-4">
              Refunds go back to your original payment source. For prepaid orders, this usually
              takes about 5 working days. For COD returns, provide bank details to receive refunds.
            </p>

            <p className="text-stone-600 leading-relaxed">
              <strong>Is there a restocking fee?</strong> Usually no — but some cases (like opened
              items) may include restocking fees.
            </p>
          </section>

          {/* CONTACT */}
          <section className="mb-8">
            <h2 className="text-2xl font-medium text-stone-900 mb-4">
              Contact Us
            </h2>

            <p className="text-stone-600 leading-relaxed mb-2">
              <strong>How can I reach THE LV8 customer support?</strong>
            </p>
            <p className="text-stone-600 leading-relaxed mb-4">
              Email us at <strong>support@thelv8.com</strong> or call <strong>+91 93910 37716</strong>.
              Support hours are Monday–Friday, 9:00 AM to 6:00 PM.
            </p>

            <p className="text-stone-600 leading-relaxed mb-2">
              <strong>Response time?</strong>
            </p>
            <p className="text-stone-600 leading-relaxed mb-4">
              We strive to reply within 1 hour during support hours.
            </p>

            <p className="text-stone-600 leading-relaxed mb-2">
              <strong>Where is your office?</strong>
            </p>
            <p className="text-stone-600 leading-relaxed">
              Beside Govt 2BHK Apartments, Bhadurpally, Hyderabad — 500043, India.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
