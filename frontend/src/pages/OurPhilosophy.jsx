import React, { useEffect } from "react";
import Layout from "../layout/Layout";
import { Helmet } from "react-helmet-async";
import { useLoading } from "../context/LoadingContext";

function OurPhilosophy() {
  const beliefs = [
    {
      title: "Commitment to Craftsmanship",
      desc: "Each creation is made with precision, passion, and respect for tradition while embracing modern design.",
      icon: "🪡",
    },
    {
      title: "Sustainable Values",
      desc: "We believe true luxury is sustainable, built with intention, and never mass-produced.",
      icon: "🌱",
    },
    {
      title: "Timeless Stories",
      desc: "Our pieces are not just garments, but stories that connect the past with the present.",
      icon: "📖",
    },
    {
      title: "Ethical Production",
      desc: "Through our pre-order model, we ensure zero waste and mindful craftsmanship.",
      icon: "♻️",
    },
  ];

  const { setLoading } = useLoading();

  useEffect(() => {
      setLoading(true);
  
      const timer = setTimeout(() => {
        setLoading(false);
      }, 2000);
  
      return () => clearTimeout(timer);
    }, [setLoading]);

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "https://www.shahumumbai.com";
  const canonical = `${baseUrl}/ourphilosophy`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
      { "@type": "ListItem", position: 2, name: "Our Philosophy", item: canonical },
    ],
  };

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Our Philosophy — Shahu Mumbai",
    url: canonical,
    description:
      "Heritage, craftsmanship, sustainability, and ethical pre-order production at Shahu Mumbai.",
  };

  return (
    <Layout>
      <Helmet>
  {/* Core SEO */}
  <title>Our Philosophy — Shahu Mumbai</title>
  <meta
    name="description"
    content="Heritage, craftsmanship, sustainability, and ethical pre-order production at Shahu Mumbai."
  />
  <meta name="robots" content="index,follow,max-image-preview:large" />
  <meta
    name="keywords"
    content="Shahu Mumbai philosophy, brand values, craftsmanship, sustainable luxury, ethical fashion, pre-order model, artisan-made sarees"
  />

  {/* Canonical + hreflang */}
  <link rel="canonical" href={canonical} />
  <link rel="alternate" hrefLang="en-IN" href={canonical} />
  <link rel="alternate" hrefLang="x-default" href={canonical} />

  {/* Open Graph */}
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Shahu Mumbai" />
  <meta property="og:locale" content="en_IN" />
  <meta property="og:title" content="Our Philosophy — Shahu Mumbai" />
  <meta
    property="og:description"
    content="Discover the values that shape every Shahu creation: craftsmanship, sustainability, and timeless stories."
  />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content={`${baseUrl}/og/philosophy.jpg`} />
  <meta property="og:image:alt" content="Shahu Mumbai — Our Philosophy" />

  {/* Twitter */}
  {/* <meta name="twitter:card" content="summary_large_image" />
  If you have a handle, you can add it:
  <meta name="twitter:site" content="@yourhandle" />
  <meta name="twitter:title" content="Our Philosophy — Shahu Mumbai" />
  <meta
    name="twitter:description"
    content="Craftsmanship, sustainability, and ethical pre-order production at Shahu Mumbai."
  />
  <meta name="twitter:image" content={`${baseUrl}/og/philosophy.jpg`} /> */}

  {/* Structured Data: Breadcrumbs (kept) */}
  <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>

  {/* Structured Data: WebPage (kept) */}
  <script type="application/ld+json">{JSON.stringify({
    ...webPageJsonLd,
    isPartOf: { "@type": "WebSite", name: "Shahu Mumbai", url: baseUrl }
  })}</script>

  {/* Structured Data: ItemList of brand values as DefinedTerms */}
  <script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Shahu Mumbai Brand Values",
      "numberOfItems": beliefs.length,
      "itemListElement": beliefs.map((b, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "item": {
          "@type": "DefinedTerm",
          "name": b.title,
          "description": b.desc,
          "inDefinedTermSet": canonical
        }
      }))
    })}
  </script>
</Helmet>


      <section className="bg-[#F1E7E5] py-16 px-6 md:px-20 lg:px-32">
        <div className="max-w-6xl mx-auto">
          {/* Heading */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-8 text-center animate-fade-in">
            Our Philosophy
          </h1>

          {/* Intro */}
          <p className="text-lg text-gray-700 leading-relaxed mb-16 text-center animate-fade-in delay-200 max-w-3xl mx-auto">
            At <span className="font-semibold text-gray-800">Shahu</span>, 
            heritage, craftsmanship, and contemporary art inspired by ancient history 
            come together in every creation. Fashion, for us, is more than just attire— 
            it is a story of rarity, meaning, and timelessness. We believe true luxury 
            is not mass-produced but intentional, sustainable, and crafted with care. 
            With our pre-order production model, every piece is created with zero waste 
            and personalized detail.
          </p>

          {/* Horizontal Stepper */}
          <div className="relative flex flex-col md:flex-row items-center justify-between md:space-x-12 space-y-12 md:space-y-0">
            {beliefs.map((item, idx) => (
              <div
                key={idx}
                className="flex-1 text-center animate-fade-in"
                style={{ animationDelay: `${idx * 0.2}s` }}
              >
                {/* Icon Circle */}
                <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-white border border-gray-300 shadow mb-4">
                  <span className="text-3xl">{item.icon}</span>
                </div>
                {/* Title */}
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {item.title}
                </h3>
                {/* Description */}
                <p className="text-gray-600 text-sm max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

export default OurPhilosophy;
