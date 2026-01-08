export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl md:text-5xl font-light text-stone-900 mb-8">
          Shipping Policy
        </h1>

        <div className="prose prose-stone max-w-none">
          {/* SHIPPING & PAYMENT POLICY */}
          <section className="mb-8">
            <h2 className="text-2xl font-medium text-stone-900 mb-4">
              Shipping & Payment Policy
            </h2>
            <p className="text-stone-600 leading-relaxed">
              We know no one likes to pay for shipping (us included!). You expect
              your products to reach you safe and sound, on time, and without
              shipping charges. That’s why THE LV8 offers <strong>free shipping
              across India</strong> on a minimum order value of <strong>₹599</strong>.
              Shop freely and leave the shipping worries to us.
            </p>
          </section>

          {/* SHIPPING POLICY */}
          <section className="mb-8">
            <h2 className="text-2xl font-medium text-stone-900 mb-4">
              Shipping Policy
            </h2>
            <p className="text-stone-600 leading-relaxed mb-4">
              THE LV8 ensures that all products are delivered in excellent
              condition and in the shortest time possible.
            </p>

            <ul className="list-disc list-inside text-stone-600 space-y-2 ml-4">
              <li>
                Orders are shipped within <strong>3–5 working days</strong> of
                placing the order.
              </li>
              <li>
                Domestic deliveries (India) usually take <strong>2–10 working days</strong>
                after dispatch.
              </li>
              <li>
                International orders may take <strong>10–15 working days</strong>
                for delivery.
              </li>
              <li>
                Ready fabrics are delivered within <strong>2–4 working days</strong>,
                while customized fabric orders may take <strong>7–10 working days</strong>.
              </li>
            </ul>
          </section>

          {/* DELAYS */}
          <section className="mb-8">
            <p className="text-stone-600 leading-relaxed">
              While we strive to meet delivery timelines, there may be rare
              delays due to circumstances beyond our control, including courier
              or transit issues.
            </p>
          </section>

          {/* CHARGES */}
          <section className="mb-8">
            <h2 className="text-2xl font-medium text-stone-900 mb-4">
              Shipping Charges & Taxes
            </h2>
            <ul className="list-disc list-inside text-stone-600 space-y-2 ml-4">
              <li>
                Products requiring separate shipping charges will be clearly
                indicated on the product detail page.
              </li>
              <li>
                Only one shipping address can be used per order. Multiple
                addresses require separate orders.
              </li>
              <li>
                Extra shipping charges apply to all international orders.
              </li>
              <li>
                All customs duties and taxes for international orders shall be
                borne by the customer.
              </li>
              <li>
                The amount shown on the payment page is the final payable amount.
              </li>
              <li>
                Prices are inclusive of applicable taxes (terms & conditions
                apply).
              </li>
            </ul>
          </section>

          {/* COD */}
          <section className="mb-8">
            <h2 className="text-2xl font-medium text-stone-900 mb-4">
              Cash on Delivery (COD)
            </h2>
            <p className="text-stone-600 leading-relaxed">
              Cash on Delivery (COD) is available only for orders with a minimum
              value of <strong>₹599</strong>.
            </p>
          </section>

          {/* DELIVERY */}
          <section className="mb-8">
            <h2 className="text-2xl font-medium text-stone-900 mb-4">
              Order Delivery
            </h2>
            <p className="text-stone-600 leading-relaxed mb-4">
              Delivery is considered complete once the products are delivered
              to the address provided by you at checkout.
            </p>
            <p className="text-stone-600 leading-relaxed">
              Delivery timelines are approximate and may vary based on courier
              operations and factors outside our control.
            </p>
          </section>

          {/* TRACKING */}
          <section className="mb-8">
            <h2 className="text-2xl font-medium text-stone-900 mb-4">
              Order Tracking
            </h2>
            <p className="text-stone-600 leading-relaxed">
              Once your order is shipped, you will receive an email with courier
              and tracking details to monitor your shipment online.
            </p>
          </section>

          {/* ADDITIONAL */}
          <section className="mb-8">
            <h2 className="text-2xl font-medium text-stone-900 mb-4">
              Additional Information
            </h2>
            <ul className="list-disc list-inside text-stone-600 space-y-2 ml-4">
              <li>We do not offer express delivery.</li>
              <li>
                By placing an order on THELV8.IN, you authorize our logistics
                partners to contact you regarding delivery.
              </li>
              <li>
                Customs duties on international returns will be deducted from
                the refundable amount.
              </li>
              <li>
                For bulk orders, shipping charges and taxes shall be borne by
                the customer.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
