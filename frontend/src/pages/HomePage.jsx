import React from "react";
import { Helmet } from "react-helmet-async";
import Layout from "../layout/Layout";
import Hero from "../components/Hero";
import Featured from "../components/Featured";
import Collections from "../components/Collections";
import UpcomingProducts from "../components/UpcomingProduct";

function HomePage() {
  const url =
    typeof window !== "undefined"
      ? window.location.origin + "/"
      : "https://www.shahumumbai.com/";

  return (
    <Layout>
      <Helmet>
        <title>Shahu Mumbai — Authentic Handwoven Sarees</title>
        <meta
          name="description"
          content="Explore Shahu Mumbai's authentic handwoven sarees — timeless craftsmanship with contemporary elegance. Made-to-order, sustainable luxury."
        />
        <link rel="canonical" href={url} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Shahu Mumbai — Authentic Handwoven Sarees" />
        <meta
          property="og:description"
          content="Authentic handwoven sarees crafted by artisans. Sustainable, made-to-order luxury."
        />
        <meta property="og:url" content={url} />
        <meta property="og:image" content="https://www.shahumumbai.com/og/homepage.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <Hero />
      <UpcomingProducts />
      <Featured />
      <Collections />
    </Layout>
  );
}

export default HomePage;
