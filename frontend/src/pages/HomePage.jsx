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
import Logo from "../assets/ShahuLogo.png";

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
        <title>Shahu</title>
        <meta
          name="description"
          //content="Explore Shahu Mumbai’s premium ethnic wear collection, where traditional craftsmanship meets contemporary design for every occasion."
          content="Explore Shahu's premium ethnic wear collection, where traditional craftsmanship meets contemporary design for every occasion."
        />
        <meta name="robots" content="index,follow,max-image-preview:large" />
        <meta
          name="keywords"
          //content="Shahu Mumbai, ethnic wear Mumbai, designer ethnic wear, sarees, Indian fashion, premium ethnic clothing, traditional and modern styles"
          content="Shahu, ethnic wear Mumbai, designer ethnic wear, sarees, Indian fashion, premium ethnic clothing, traditional and modern styles"
        />

        {/* Canonical + hreflang */}
        <link rel="canonical" href={url} />
        <link rel="alternate" hrefLang="en-IN" href={url} />
        <link rel="alternate" hrefLang="x-default" href={url} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Shahu Mumbai" />
        <meta property="og:locale" content="en_IN" />
        <meta property="og:title" content="Shahu" />
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
            name: "Shahu",
            url: "https://www.shahumumbai.com/",
            logo: {Logo},
          })}
        </script>

        {/* Structured Data: WebSite + SearchAction (sitelinks search box eligibility) */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Shahu",
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
      {hasUpcoming === false ? (
        <div></div>
      ) : (
        <UpcomingProducts />
      )}
      <Featured />
      <Collections />
    </Layout>
  );
}

export default HomePage;
