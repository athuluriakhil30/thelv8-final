export default function ContactUsPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl md:text-5xl font-light text-stone-900 mb-8">
          Contact Us
        </h1>

        <div className="prose prose-stone max-w-none">
          {/* INTRO */}
          <section className="mb-8">
            <p className="text-stone-600 leading-relaxed">
              We’re here to help. If you have any questions, concerns, or need
              assistance with your order, feel free to reach out to us using
              the details below.
            </p>
          </section>

          {/* CONTACT DETAILS */}
          <section className="mb-8">
            <h2 className="text-2xl font-medium text-stone-900 mb-4">
              Contact Information
            </h2>

            <div className="bg-stone-50 p-6 rounded-lg">
              <p className="text-stone-700">
                <strong>Company:</strong> THE LV8 Fashion Pvt Ltd
              </p>
              <p className="text-stone-700 mt-2">
                <strong>Address:</strong> Beside Govt 2BHK Apartments,
                Bhadurpally, Hyderabad – 500043, India
              </p>
              <p className="text-stone-700 mt-2">
                <strong>Phone:</strong> 9391037716
              </p>
              <p className="text-stone-700 mt-2">
                <strong>Email:</strong> support@thelv8.com
              </p>
              <p className="text-stone-700 mt-2">
                <strong>Working Hours:</strong> Monday – Friday (9:00 AM – 6:00 PM)
              </p>
            </div>
          </section>

          {/* MAP */}
          <section className="mb-8">
            <h2 className="text-2xl font-medium text-stone-900 mb-4">
              Our Location
            </h2>

            <div className="w-full h-[350px] rounded-lg overflow-hidden border border-stone-200">
              <iframe
                title="THE LV8 Location"
                src="https://www.openstreetmap.org/export/embed.html?bbox=78.431747%2C17.547168%2C78.451747%2C17.567168&layer=mapnik&marker=17.557168%2C78.441747"
                className="w-full h-full"
                loading="lazy"
              />
            </div>

            <p className="text-sm text-stone-500 mt-2">
              Map data © OpenStreetMap contributors
            </p>
          </section>

          {/* SUPPORT NOTE */}
          <section className="mb-8">
            <p className="text-stone-600 leading-relaxed">
              Our support team strives to respond to all queries as quickly as
              possible during working hours. Please ensure you provide accurate
              contact details so we can assist you effectively.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
