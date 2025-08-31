import React from "react";
import Layout from "../layout/Layout";
import Hero from "../components/Hero";
import Featured from "../components/Featured"; 
import Collections from "../components/Collections";
import UpcomingProducts from "../components/UpcomingProduct";
 
function HomePage() {
  return (
    <Layout>
      <Hero />
      <UpcomingProducts />
      <Featured />
      <Collections />
    </Layout>
  );
}

export default HomePage;
