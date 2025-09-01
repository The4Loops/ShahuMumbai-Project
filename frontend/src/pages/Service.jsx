import Layout from "../layout/Layout";

const services = [
  {
    title: "Personal Styling",
    description:
      "Work with our stylists to find the perfect vintage look tailored to your personality.",
    icon: "👗",
  },
  {
    title: "Custom Sourcing",
    description:
      "Looking for something rare? Let us find the vintage piece of your dreams.",
    icon: "🔍",
  },
  {
    title: "Vintage Curation",
    description:
      "Curated collections for boutiques and events with a focus on storytelling and history.",
    icon: "🧳",
  },
  {
    title: "Restoration",
    description:
      "We revive timeless pieces while preserving their unique character and authenticity.",
    icon: "🪡",
  },
  {
    title: "Home Decor Styling",
    description:
      "Add charm to your space with personalized vintage decor recommendations.",
    icon: "🏡",
  },
  {
    title: "Event Styling",
    description:
      "Vintage styling for weddings, shoots, and special events. Make it unforgettable.",
    icon: "📸",
  },
];

function ServicePage() {
  return (
    <Layout>
      <div className="bg-[#F1E7E5] px-4 sm:px-8 md:px-16 lg:px-24 py-16 text-[#2e2e2e] min-h-screen">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-serif mb-4">Our Services</h1>
          <p className="text-[#555] max-w-xl mx-auto">
            Discover a range of personalized vintage services designed to elevate
            your style and space.
          </p>
        </div>

        {/* Mobile/Tablet Timeline */}
        <div className="block lg:hidden relative border-l-2 border-[#d4b8a5] pl-6 space-y-10 sm:pl-8 md:pl-12 max-w-2xl mx-auto">
          {services.map((service, idx) => (
            <div key={idx} className="relative">
              {/* Dot with icon */}
              <div className="absolute -left-5 top-1.5 w-10 h-10 flex items-center justify-center bg-white border-2 border-[#d4b8a5] rounded-full text-xl sm:-left-6 sm:w-12 sm:h-12">
                {service.icon}
              </div>

              {/* Content */}
              <h3 className="text-lg sm:text-xl font-semibold mb-1">
                {service.title}
              </h3>
              <p className="text-[#555] text-sm sm:text-base leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>

        {/* Desktop Grid with spacing */}
        <div className="hidden lg:grid grid-cols-3 gap-10 max-w-6xl mx-auto">
          {services.map((service, idx) => (
            <div
              key={idx}
              className="p-8 text-center border border-gray-300/40 rounded-xl bg-white/50 hover:shadow-md transition"
            >
              <div className="text-5xl mb-4 transition-transform hover:scale-110">
                {service.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
              <p className="text-[#555] text-base">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default ServicePage;
