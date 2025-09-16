import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Layout from "../layout/Layout";

// Simple reusable animation wrapper
const AnimatedSection = ({ children, className = "" }) => (
  <div className={`animate-fade-up ${className}`}>{children}</div>
);

function About() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://www.shahumumbai.com";
  const url = `${base}/about`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${base}/` },
      { "@type": "ListItem", position: 2, name: "About", item: url },
    ],
  };

  const aboutPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About Shahu Mumbai",
    url,
    description:
      "Shahu is a luxury fashion house rooted in India’s heritage and crafted sustainably by contemporary artisans.",
  };

  return (
    <Layout>
      <Helmet>
        <title>About — Shahu Mumbai</title>
        <meta
          name="description"
          content="Discover the Shahu Mumbai story: heritage, craftsmanship, sustainable luxury, and the artisans behind every piece."
        />
        <link rel="canonical" href={url} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="About — Shahu Mumbai" />
        <meta
          property="og:description"
          content="Heritage, craftsmanship & timeless luxury. Learn about our sustainable philosophy and artisan stories."
        />
        <meta property="og:url" content={url} />
        <meta property="og:image" content={`${base}/og/about.jpg`} />
        <meta name="twitter:card" content="summary_large_image" />

        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(aboutPageJsonLd)}</script>
      </Helmet>

      <div className="bg-[#F1E7E5] text-[#3B2E1E]">
        {/* HERO */}
        <section className="relative h-[500px] bg-gradient-to-r from-[#6B4226] to-[#3B2E1E] flex items-center justify-center text-center">
          <div className="bg-black/40 p-8 rounded-xl animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold text-white">Our Story</h1>
            <p className="mt-4 text-lg text-[#F6E7D8]">Heritage, Craftsmanship & Timeless Luxury</p>
          </div>
        </section>

        {/* ROOTS */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 px-8 py-16 items-center">
          <AnimatedSection>
            <h2 className="text-3xl font-bold mb-6">Roots & Inspiration</h2>
            <p className="text-base text-[#6B6B6B] leading-relaxed">
              Shahu is a luxury fashion house of Ancient Indian roots meeting effortless luxury. Rooted in India’s
              timeless traditions and inspired by the cosmopolitan spirit of Mumbai, Shahu stands as a symbol of
              refined indulgence.{"\n\n"}
              Our designs are inspired by art lost 5,000–10,000 years in history. Where modern fashion stops imagining,
              our designers begin searching through ancient stories and textiles of the Indian subcontinent.
            </p>
          </AnimatedSection>
          <div className="rounded-xl bg-[#6B4226] h-72 w-full animate-fade-in" />
        </section>

        {/* CHALLENGE */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 px-8 py-16 items-center">
          <div className="rounded-xl bg-[#6B4226] h-72 w-full animate-fade-in" />
          <AnimatedSection>
            <h2 className="text-3xl font-bold mb-6">The Challenge in Fashion</h2>
            <p className="text-base text-[#6B6B6B] leading-relaxed">
              Founder Bhumi Shahu, while studying in New York, realized that modern luxury brands often took inspiration
              from India but rarely credited artisans. Many “handmade” claims were false—mass-produced in factories
              instead of being crafted by true artisans.{"\n\n"}
              This inspired her to create a brand that respects authenticity, artistry, and people behind every garment.
            </p>
          </AnimatedSection>
        </section>

        {/* BIRTH OF SHAHU */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 px-8 py-16 items-center">
          <AnimatedSection>
            <h2 className="text-3xl font-bold mb-6">The Birth of Shahu</h2>
            <p className="text-base text-[#6B6B6B] leading-relaxed">
              Shahu was born in Mumbai with the vision to celebrate artisans, protect the planet, and pass down timeless
              creations across generations. Each piece is made to order, minimizing waste and ensuring exclusivity.{"\n\n"}
              This philosophy challenges the fast-fashion industry and restores the dignity of craftsmanship.
            </p>
          </AnimatedSection>
          <div className="rounded-xl bg-[#6B4226] h-72 w-full animate-fade-in" />
        </section>

        {/* SUSTAINABILITY */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 px-8 py-16 items-center">
          <div className="rounded-xl bg-[#6B4226] h-72 w-full animate-fade-in" />
          <AnimatedSection>
            <h2 className="text-3xl font-bold mb-6">Sustainable Philosophy</h2>
            <p className="text-base text-[#6B6B6B] leading-relaxed">
              At Shahu, we follow a pre-order model: only once you place an order do artisans begin crafting it. This
              process honors time, labor, and the environment—ensuring every creation has a purpose and story.
            </p>
          </AnimatedSection>
        </section>

        {/* ARTISAN STORIES */}
        <section className="px-8 py-16">
          <AnimatedSection className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">The Stories Behind Every Piece</h2>
            <p className="text-base text-[#6B6B6B] leading-relaxed">
              Every piece tells the story of an artisan—a mother funding her child’s education, a father preserving
              traditions away from home, or a widow continuing her late husband’s passion.{"\n\n"}
              Each dollar invested in Shahu uplifts these artisans and sustains India’s cultural heritage.
            </p>
          </AnimatedSection>
        </section>

        {/* QUOTE */}
        <section className="text-center py-12 bg-[#F1E7E5] animate-fade-in">
          <p className="text-2xl md:text-3xl italic font-light">
            “Fashion is not just worn, it’s lived through heritage and soul.”
          </p>
          <p className="mt-4 text-sm text-[#6B6B6B]">- Shahu</p>
        </section>

        {/* THE CRAFT */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 px-8 py-16 items-center">
          <div className="rounded-xl bg-[#6B4226] h-72 w-full animate-fade-in" />
          <AnimatedSection>
            <h2 className="text-3xl font-bold mb-6">The Craft</h2>
            <p className="text-base text-[#6B6B6B] leading-relaxed">
              Each design is a celebration of India’s artistic heritage, combining intricate handwork with contemporary
              silhouettes. Every piece is made slowly, thoughtfully, and sustainably—an heirloom of culture and beauty.
            </p>
          </AnimatedSection>
        </section>

        {/* THE SHAHU STORY */}
        <section className="relative h-[400px] md:h-[500px] bg-gradient-to-r from-[#D6AD60] to-[#3B2E1E] flex items-center justify-center text-white text-center animate-fade-in">
          <div className="bg-black/40 p-8 rounded-xl">
            <h2 className="text-3xl md:text-4xl font-semibold">The Shahu Mumbai Story</h2>
            <a
              href="/story"
              className="mt-6 inline-block px-6 py-3 bg-[#F6E7D8] text-[#3B2E1E] rounded-full text-sm hover:bg-[#e0ccb5]"
            >
              Learn More
            </a>
          </div>
        </section>
      </div>
    </Layout>
  );
}

export default About;
