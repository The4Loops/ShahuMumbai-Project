import React from "react";
import { Helmet } from "react-helmet-async";
import Layout from "../layout/Layout";
import Hero from "../components/Hero";
import Featured from "../components/Featured";
import Collections from "../components/Collections";
import UpcomingProducts from "../components/UpcomingProduct";
import { useLocation } from "react-router-dom";

function HomePage() {
  const location = useLocation();
  const url =
    typeof window !== "undefined"
      ? window.location.origin + "/"
      : "https://www.shahumumbai.com/";

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

        {/* Twitter */}
        {/* <meta name="twitter:card" content="summary_large_image" />
        If you have a handle, uncomment:
        <meta name="twitter:site" content="@yourhandle" />
        <meta name="twitter:title" content="Shahu Mumbai — Authentic Handwoven Sarees" />
        <meta
          name="twitter:description"
          content="Authentic handwoven sarees crafted by artisans. Sustainable, made-to-order luxury."
        />
        <meta name="twitter:image" content="https://www.shahumumbai.com/og/homepage.jpg" /> */}

        {/* Structured Data: Organization */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Shahu Mumbai",
            "url": "https://www.shahumumbai.com/",
            "logo": "https://www.shahumumbai.com/static/logo-300.png",
            // "sameAs": [
            //   "https://www.instagram.com/shahumumbai",
            //   "https://www.linkedin.com/company/yourhandle",
            //   "https://youtube.com/@bhumishahu"
            // ]
          })}
        </script>

        {/* Structured Data: WebSite + SearchAction (sitelinks search box eligibility) */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Shahu Mumbai",
            "url": "https://www.shahumumbai.com/",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://www.shahumumbai.com/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })}
        </script>
      </Helmet>


      <Hero />
      <UpcomingProducts />
      <Featured />
      <Collections />
    </Layout>
  );
}

export default HomePage;
