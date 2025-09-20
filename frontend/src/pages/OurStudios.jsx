import Layout from "../layout/Layout";
import heroimages from "../assets/OurStudios/heroimage.png";
import city from "../assets/OurStudios/moderncity.png";
import mother from "../assets/OurStudios/mother.png";
import father from "../assets/OurStudios/Father.png";
import widow from "../assets/OurStudios/widow.png";
import mini from "../assets/OurStudios/bgmini.png";
import { Helmet } from "react-helmet-async";

function OurStudios() {
  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "https://www.shahumumbai.com";
  const canonical = `${baseUrl}/ourstudios`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
      { "@type": "ListItem", position: 2, name: "Our Studio", item: canonical },
    ],
  };

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Our Studio — Shahu Mumbai",
    url: canonical,
    description:
      "Inside Shahu Mumbai’s studio where heritage meets modernity and every piece is crafted with care.",
  };

  return (
    <Layout>
      <Helmet>
        {/* Core SEO */}
        <title>Our Studio — Shahu Mumbai</title>
        <meta
          name="description"
          content="Step into Shahu Mumbai’s studio: a global fashion house rooted in Indian craftsmanship, shaped in Mumbai."
        />
        <meta name="robots" content="index,follow,max-image-preview:large" />
        <meta
          name="keywords"
          content="Shahu Mumbai studio, fashion studio Mumbai, artisan studio India, handcrafted sarees studio, sustainable fashion house"
        />

        {/* Canonical + hreflang */}
        <link rel="canonical" href={canonical} />
        <link rel="alternate" hrefLang="en-IN" href={canonical} />
        <link rel="alternate" hrefLang="x-default" href={canonical} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Shahu Mumbai" />
        <meta property="og:locale" content="en_IN" />
        <meta property="og:title" content="Our Studio — Shahu Mumbai" />
        <meta
          property="og:description"
          content="Where heritage meets modernity — handmade pieces and human stories behind every creation."
        />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={`${baseUrl}/og/studio.jpg`} />
        <meta property="og:image:alt" content="Shahu Mumbai — inside our Mumbai studio" />

        {/* Twitter */}
        {/* <meta name="twitter:card" content="summary_large_image" /> */}
        {/* If you have a handle, you can add: */}
        {/* <meta name="twitter:site" content="@yourhandle" /> */}
        {/* <meta name="twitter:title" content="Our Studio — Shahu Mumbai" />
        <meta
          name="twitter:description"
          content="A global fashion house rooted in Indian craftsmanship and shaped in Mumbai."
        />
        <meta name="twitter:image" content={`${baseUrl}/og/studio.jpg`} /> */}

        {/* Structured Data: Breadcrumbs (kept) */}
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>

        {/* Structured Data: WebPage (kept, lightly enriched) */}
        <script type="application/ld+json">
          {JSON.stringify({
            ...webPageJsonLd,
            isPartOf: { "@type": "WebSite", name: "Shahu Mumbai", url: baseUrl }
          })}
        </script>

        {/* Structured Data: ImageGallery of studio stories */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ImageGallery",
            name: "Shahu Mumbai — Our Studio Stories",
            url: canonical,
            image: [
              {
                "@type": "ImageObject",
                contentUrl: typeof mother === "string" ? mother : `${baseUrl}/og/studio.jpg`,
                caption: "A Mother’s Dream — funding her children’s education with each stitch"
              },
              {
                "@type": "ImageObject",
                contentUrl: typeof father === "string" ? father : `${baseUrl}/og/studio.jpg`,
                caption: "A Father’s Legacy — preserving traditions while supporting his family"
              },
              {
                "@type": "ImageObject",
                contentUrl: typeof widow === "string" ? widow : `${baseUrl}/og/studio.jpg`,
                caption: "A Widow’s Passion — continuing her late husband’s vision through fashion"
              }
            ]
          })}
        </script>

        {/* Structured Data: CollectionPage wrapper */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Our Studio — Shahu Mumbai",
            url: canonical,
            description:
              "Inside Shahu Mumbai’s studio where heritage meets modernity and every piece is crafted with care.",
            isPartOf: { "@type": "WebSite", name: "Shahu Mumbai", url: baseUrl }
          })}
        </script>
      </Helmet>


      <div className="bg-[#F1E7E5] text-[#2e2e2e]">
        {/* Hero Section */}
        <section
          className="relative bg-center bg-cover text-center py-20 sm:py-28 px-4 sm:px-6"
          style={{
            backgroundImage: `url(${heroimages})`,
          }}
        >
          <h1 className="text-4xl sm:text-6xl font-serif mb-6 tracking-wide text-[#2e2e2e]">
            Our Studio
          </h1>
          <p className="max-w-3xl mx-auto text-base sm:text-lg font-bold text-[#333] leading-relaxed">
            Where heritage meets modernity — a creative house rooted in India’s
            traditions and connected to the world.
          </p>
        </section>

        {/* About Studio */}
        <section className="max-w-6xl mx-auto py-8 sm:py-24 px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-12 items-center">
          {/* Image */}
          <div className="h-60 sm:h-80 md:h-full">
            <img
              src={city}
              alt="Mini Studio"
              className="w-full h-full object-cover rounded-2xl shadow-lg"
            />
          </div>

          {/* Content */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif mb-4 sm:mb-6">
              Global Fashion House — Mumbai
            </h2>
            <p className="text-[#555] text-base sm:text-lg leading-relaxed">
              Based in Mumbai, a city that reflects both India’s rich artistic
              traditions and a cosmopolitan spirit. A global fashion house with
              Indian roots, blending local craftsmanship with international
              vision.
            </p>
          </div>
        </section>

        {/* Crafted with Care */}
        <section className="bg-[#F1E7E5] py-2 sm:py-24 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-serif mb-6 sm:mb-8">
              Crafted with Care
            </h2>
            <p className="max-w-3xl mx-auto text-base sm:text-lg text-[#444] leading-relaxed mb-12 sm:mb-16">
              Every creation at Shahu is handmade by skilled artisans. Each
              piece carries a human story of resilience and tradition.
            </p>

            {/* Stories Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-10">
              {/* Mother */}
              <div
                className="relative h-64 sm:h-72 rounded-2xl shadow-md p-6 sm:p-8 flex flex-col justify-center items-center text-center hover:shadow-xl transition bg-cover bg-center"
                style={{ backgroundImage: `url(${mother})` }}
              >
                <div className="absolute inset-0 bg-black/40 rounded-2xl" />
                <div className="relative z-10">
                  <h3 className="font-semibold text-lg sm:text-xl mb-2 sm:mb-3 text-white">
                    A Mother’s Dream
                  </h3>
                  <p className="text-white text-xs sm:text-sm leading-relaxed">
                    Funding her children’s education with each stitch of fabric.
                  </p>
                </div>
              </div>

              {/* Father */}
              <div
                className="relative h-64 sm:h-72 rounded-2xl shadow-md p-6 sm:p-8 flex flex-col justify-center items-center text-center hover:shadow-xl transition bg-cover bg-center"
                style={{ backgroundImage: `url(${father})` }}
              >
                <div className="absolute inset-0 bg-black/40 rounded-2xl" />
                <div className="relative z-10">
                  <h3 className="font-semibold text-lg sm:text-xl mb-2 sm:mb-3 text-white">
                    A Father’s Legacy
                  </h3>
                  <p className="text-white text-xs sm:text-sm leading-relaxed">
                    Preserving cultural traditions while supporting his family.
                  </p>
                </div>
              </div>

              {/* Widow */}
              <div
                className="relative h-64 sm:h-72 rounded-2xl shadow-md p-6 sm:p-8 flex flex-col justify-center items-center text-center hover:shadow-xl transition bg-cover bg-center"
                style={{ backgroundImage: `url(${widow})` }}
              >
                <div className="absolute inset-0 bg-black/40 rounded-2xl" />
                <div className="relative z-10">
                  <h3 className="font-semibold text-lg sm:text-xl mb-2 sm:mb-3 text-white">
                    A Widow’s Passion
                  </h3>
                  <p className="text-white text-xs sm:text-sm leading-relaxed">
                    Continuing her late husband’s vision through fashion.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Mini Text */}
            <p
              className="relative max-w-4xl mx-auto mt-12 sm:mt-16 text-[#333] font-medium text-base sm:text-lg text-center p-6 sm:p-8 rounded-2xl shadow-md bg-cover bg-center"
              style={{ backgroundImage: `url(${mini})` }}
            >
              <span className="relative z-10">
                Every dollar supports lives, preserves heritage, and celebrates
                craftsmanship over machinery.
              </span>
              <span className="absolute inset-0 bg-white/70 rounded-2xl" />
            </p>
          </div>
        </section>
      </div>
    </Layout>
  );
}

export default OurStudios;
