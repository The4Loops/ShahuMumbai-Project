import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import Layout from "../layout/Layout";
import Hero from "../components/Hero";
import Featured from "../components/Featured";
import Collections from "../components/Collections";
import UpcomingProducts from "../components/UpcomingProduct";
import { Link, useLocation } from "react-router-dom";
import api from "../supabase/axios";
import { useLoading } from "../context/LoadingContext";

function HomePage() {
  const location = useLocation();
  const url =
    typeof window !== "undefined"
      ? window.location.origin + "/"
      : "https://www.shahumumbai.com/";

  // null = unknown (loading / network error), true/false = known
  const [hasUpcoming, setHasUpcoming] = useState(null);
  const { setLoading } = useLoading();

  useEffect(() => {
    let alive = true;

    // We only need a quick check, not full data.
    // Strategy: fetch products & check if any have LaunchingDate in the future.
    const checkUpcoming = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/api/products");
        if (!alive) return;

        const list = Array.isArray(data) ? data : data?.items || [];
        const now = Date.now();

        const anyUpcoming = list.some((p) => {
          const d = p?.LaunchingDate ? new Date(p.LaunchingDate).getTime() : NaN;
          // Treat a valid future launching date as "upcoming"
          return Number.isFinite(d) && d > now;
        });

        setHasUpcoming(anyUpcoming);
      } catch (e) {
        // Don’t block the page—fallback to rendering the normal component
        setHasUpcoming(null);
      }finally {
        if (alive) setLoading(false); // Always stop loading
      }
    };

    checkUpcoming();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Layout location={location}>
      <Helmet>
        {/* Core SEO */}
        <title>Shahu Mumbai — Authentic Handwoven Sarees</title>
        <meta
          name="description"
          content="Explore Shahu Mumbai's authentic handwoven sarees — timeless craftsmanship with contemporary elegance. Made-to-order, sustainable luxury."
        />
        <meta name="robots" content="index,follow,max-image-preview:large" />
        <meta
          name="keywords"
          content="Shahu Mumbai, handwoven sarees, Indian sarees, artisan-made, sustainable luxury, handmade sarees Mumbai, designer sarees India"
        />

        {/* Canonical + hreflang */}
        <link rel="canonical" href={url} />
        <link rel="alternate" hrefLang="en-IN" href={url} />
        <link rel="alternate" hrefLang="x-default" href={url} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Shahu Mumbai" />
        <meta property="og:locale" content="en_IN" />
        <meta property="og:title" content="Shahu Mumbai — Authentic Handwoven Sarees" />
        <meta
          property="og:description"
          content="Authentic handwoven sarees crafted by artisans. Sustainable, made-to-order luxury."
        />
        <meta property="og:url" content={url} />
        <meta property="og:image" content="https://www.shahumumbai.com/og/homepage.jpg" />
        <meta property="og:image:alt" content="Shahu Mumbai — Authentic Handwoven Sarees" />

        {/* Structured Data: Organization */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Shahu Mumbai",
            url: "https://www.shahumumbai.com/",
            logo: "https://www.shahumumbai.com/static/logo-300.png",
          })}
        </script>

        {/* Structured Data: WebSite + SearchAction (sitelinks search box eligibility) */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Shahu Mumbai",
            url: "https://www.shahumumbai.com/",
            potentialAction: {
              "@type": "SearchAction",
              target: "https://www.shahumumbai.com/search?q={search_term_string}",
              "query-input": "required name=search_term_string",
            },
          })}
        </script>
      </Helmet>

      <Hero />

      {/* Upcoming products (with fallback message if none) */}
      {hasUpcoming === false ? (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 my-10">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
              No upcoming products right now
            </h2>
            <p className="mt-2 text-gray-600">
              We’re crafting the next drop. In the meantime, check out our released designs.
            </p>
            <div className="mt-4">
              <Link
                to="/products"
                className="inline-block rounded-full bg-gray-900 px-5 py-2.5 text-white font-medium hover:bg-black transition"
              >
                Browse All Products
              </Link>
            </div>
          </div>
        </section>
      ) : (
        // If loading or API error (hasUpcoming === null), we still render the section normally
        <UpcomingProducts />
      )}

      <Featured />
      <Collections />
    </Layout>
  );
}

export default HomePage;
