export default function CancellationPolicyPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl md:text-5xl font-light text-stone-900 mb-8">
          Cancellation & Refund Policy
        </h1>

        <div className="prose prose-stone max-w-none">
          {/* CANCELLATION POLICY */}
          <section className="mb-8">
            <h2 className="text-2xl font-medium text-stone-900 mb-4">
              Cancellation Policy
            </h2>

            <p className="text-stone-600 leading-relaxed mb-4">
              Customers may cancel an order at any time before it has been
              dispatched. Once the order is out for delivery, it cannot be
              cancelled. Generally, the cancellation window is within
              <strong> 24 hours from the date of booking</strong>. However, the
              customer may choose to reject the order at the doorstep.
            </p>

            <p className="text-stone-600 leading-relaxed mb-4">
              The cancellation time window may vary depending on the product
              category. Once the specified time window has passed, the order
              cannot be cancelled.
            </p>

            <p className="text-stone-600 leading-relaxed mb-4">
              In certain cases, cancellation after the specified time may
              attract a cancellation fee. The final cancellation window and
              applicable charges mentioned on the product page or order
              confirmation page shall be considered final.
            </p>

            <p className="text-stone-600 leading-relaxed">
              In case of cancellation by THE LV8 due to unforeseen
              circumstances, a full refund will be initiated for prepaid
              orders. THE LV8 reserves the right to accept, reject, waive, or
              modify cancellation terms at any time.
            </p>
          </section>

          {/* RETURNS POLICY */}
          <section className="mb-8">
            <h2 className="text-2xl font-medium text-stone-900 mb-4">
              Returns Policy
            </h2>

            <p className="text-stone-600 leading-relaxed mb-4">
              Returns are offered directly by THE LV8 under this policy, which
              may include options for exchange, replacement, or refund depending
              on the product and category.
            </p>

            <p className="text-stone-600 leading-relaxed">
              Not all products under a category follow the same returns policy.
              The return or replacement policy mentioned on the product page
              shall prevail over this general policy. Customers are advised to
              review the product-specific policy before placing an order.
            </p>
          </section>

          {/* REFUND TIMEFRAME */}
          <section className="mb-8">
            <h2 className="text-2xl font-medium text-stone-900 mb-4">
              Time Frame for Refund Processing
            </h2>

            <p className="text-stone-600 leading-relaxed">
              Refunds are processed within <strong>5 working days</strong> after
              the cancellation of the product.
            </p>
          </section>

          {/* REFUND METHOD */}
          <section className="mb-8">
            <h2 className="text-2xl font-medium text-stone-900 mb-4">
              How and When Refunds Are Credited
            </h2>

            <ul className="list-disc list-inside text-stone-600 space-y-2 ml-4">
              <li>
                For prepaid orders made via UPI, debit card, credit card, or
                other online payment methods, the refund will be credited back
                to the original payment source within 5 working days.
              </li>
              <li>
                For Cash on Delivery (COD) orders, customers must add their bank
                account details on THE LV8 website. The refund amount will be
                credited to the provided bank account within 5 working days
                after cancellation.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
