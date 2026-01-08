export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl md:text-5xl font-light text-stone-900 mb-8">
          Terms & Conditions
        </h1>

        <div className="prose prose-stone max-w-none">
          {/* LIMITATION OF LIABILITY */}
          <section className="mb-8">
            <h2 className="text-2xl font-medium text-stone-900 mb-4">
              Limitations of Liability
            </h2>
            <p className="text-stone-600 leading-relaxed mb-4">
              In no event shall THE LV8 be liable for any indirect, punitive,
              incidental, special, or consequential damages arising out of:
            </p>
            <ul className="list-disc list-inside text-stone-600 space-y-2 ml-4">
              <li>The use or inability to use the services or products</li>
              <li>Unauthorized access to or alteration of user data</li>
              <li>Breach of warranties by the product manufacturer</li>
              <li>
                Any other matter relating to the Platform including loss of
                data, profits, or use
              </li>
            </ul>
            <p className="text-stone-600 leading-relaxed mt-4">
              THE LV8’s liability shall be limited to the value of the product
              purchased by the user, to the maximum extent permitted by law.
            </p>
          </section>

          {/* DISCLAIMER */}
          <section className="mb-8">
            <h2 className="text-2xl font-medium text-stone-900 mb-4">
              Disclaimer of Warranties
            </h2>
            <p className="text-stone-600 leading-relaxed mb-4">
              All products and services on THE LV8 Platform are provided on an
              “as is” and “as available” basis without warranties of any kind,
              express or implied.
            </p>
            <p className="text-stone-600 leading-relaxed">
              THE LV8 does not warrant that the Platform will be available at
              all times or that the information provided is accurate, complete,
              or error-free.
            </p>
          </section>

          {/* JURISDICTION */}
          <section className="mb-8">
            <h2 className="text-2xl font-medium text-stone-900 mb-4">
              Jurisdiction / Sale in India
            </h2>
            <p className="text-stone-600 leading-relaxed">
              Unless otherwise specified, all materials and products are
              intended solely for sale within India. THE LV8 makes no
              representation regarding availability outside India and shall
              not be responsible for compliance with local laws of other
              countries.
            </p>
          </section>

          {/* INTELLECTUAL PROPERTY */}
          <section className="mb-8">
            <h2 className="text-2xl font-medium text-stone-900 mb-4">
              Intellectual Property Rights
            </h2>
            <p className="text-stone-600 leading-relaxed mb-4">
              All content on THE LV8 Platform including images, text, graphics,
              logos, videos, and software are protected by copyright,
              trademark, and intellectual property laws.
            </p>
            <p className="text-stone-600 leading-relaxed">
              Content may be used only for personal, non-commercial purposes.
              Any unauthorized reproduction or commercial use is strictly
              prohibited.
            </p>
          </section>

          {/* USER OBLIGATIONS */}
          <section className="mb-8">
            <h2 className="text-2xl font-medium text-stone-900 mb-4">
              User Obligations & Conduct
            </h2>
            <p className="text-stone-600 leading-relaxed mb-4">
              Users agree not to upload, post, or transmit any content that:
            </p>
            <ul className="list-disc list-inside text-stone-600 space-y-2 ml-4">
              <li>Is unlawful, harmful, defamatory, obscene, or misleading</li>
              <li>Infringes intellectual property or privacy rights</li>
              <li>Promotes illegal activities or fraud</li>
              <li>Contains viruses, spam, or malicious software</li>
              <li>Violates Indian laws or public order</li>
            </ul>
          </section>

          {/* FRAUD */}
          <section className="mb-8">
            <h2 className="text-2xl font-medium text-stone-900 mb-4">
              Fraudulent Activities
            </h2>
            <p className="text-stone-600 leading-relaxed mb-4">
              THE LV8 reserves the right to cancel orders or suspend accounts
              involved in fraudulent activities including but not limited to:
            </p>
            <ul className="list-disc list-inside text-stone-600 space-y-2 ml-4">
              <li>Use of invalid contact or address details</li>
              <li>Misuse of vouchers or promotional offers</li>
              <li>Excessive or false return requests</li>
              <li>Bulk or resale-oriented orders</li>
            </ul>
          </section>

          {/* TERMINATION */}
          <section className="mb-8">
            <h2 className="text-2xl font-medium text-stone-900 mb-4">
              Account Termination
            </h2>
            <p className="text-stone-600 leading-relaxed">
              THE LV8 reserves the right to terminate user accounts that violate
              these Terms & Conditions or engage in misuse of the Platform.
            </p>
          </section>

          {/* CONTACT */}
          <section className="mb-8">
            <h2 className="text-2xl font-medium text-stone-900 mb-4">
              Contact Information
            </h2>
            <div className="bg-stone-50 p-6 rounded-lg">
              <p className="text-stone-700">
                <strong>Address:</strong> Beside Govt 2BHK Apartments,
                Bhadurpally, Hyderabad – 500043, India
              </p>
              <p className="text-stone-700 mt-2">
                <strong>Phone:</strong> 9391037716
              </p>
              <p className="text-stone-700 mt-2">
                <strong>Instagram:</strong> THE_LV8
              </p>
              <p className="text-stone-700 mt-2">
                <strong>Email:</strong> support@thelv8.com
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
