import React from "react";
import Layout from "../layout/Layout";
import Hero from "../components/Hero";
import Featured from "../components/Featured"; 
import Collections from "../components/Collections";
import Newsletter from "../components/Newsletter";
 
function HomePage() {
  return (
    <Layout>
      <Hero />
      <Featured />
      <Collections />
      <Newsletter />
    </Layout>
  );
}

export default HomePage;
