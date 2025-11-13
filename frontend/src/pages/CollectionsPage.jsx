// src/pages/CollectionPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../layout/Layout";
import { Helmet } from "react-helmet-async";
import api from "../supabase/axios";
import { useLoading } from "../context/LoadingContext";   // <-- NEW

/* ------------------------------------------------------------------ */
/*                     SKELETON CARD (shown while loading)            */
/* ------------------------------------------------------------------ */
const CollectionCardSkeleton = () => (
  <div className="rounded-xl shadow bg-[#FFF9F7] border border-[#E5D1C5] overflow-hidden animate-pulse">
    <div className="h-48 bg-gray-200" />
    <div className="p-4 text-center">
      <div className="h-4 bg-gray-200 rounded w-20 mx-auto" />
    </div>
    <div className="p-3 text-center text-sm text-[#6D4C41] sm:hidden">
      <div className="h-5 bg-gray-200 rounded w-32 mx-auto mb-1" />
      <div className="h-4 bg-gray-200 rounded w-40 mx-auto" />
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
function CollectionCard({ category }) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/products?name=${encodeURIComponent(category.name)}`);
  };

  return (
    <div
      className="rounded-xl shadow hover:shadow-lg transition overflow-hidden cursor-pointer border border-[#E5D1C5] bg-[#FFF9F7] relative group"
      onClick={handleCardClick}
    >
      <div
        className="w-full h-48 flex items-center justify-center relative"
        style={{
          backgroundImage: `url(${category.cover_image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-[#2C1C15]/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white text-center px-4">
          <h2 className="text-xl font-bold mb-2">{category.name}</h2>
          <p className="text-sm">{category.description || "Explore this category"}</p>
        </div>
      </div>
      <div className="p-4 text-center">
        <p className="text-[#6D4C41] text-sm">{category.items} items</p>
      </div>
      <div className="p-3 text-center text-sm text-[#6D4C41] sm:hidden">
        <h2 className="text-lg font-semibold">{category.name}</h2>
        <p>{category.description || "Explore this category"}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
export default function CollectionPage() {
  const { setLoading } = useLoading();                 // <-- NEW
  const { id } = useParams();
  const [categories, setCategories] = useState([]);
  const [collectionTitle, setCollectionTitle] = useState("Collection");
  const [collectionDescription, setCollectionDescription] = useState("Explore this collection");
  const [loading, setLocalLoading] = useState(true);   // local flag
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCollection = async () => {
      setLoading(true);                // global spinner ON
      setLocalLoading(true);
      try {
        const response = await api.get(`/api/collections/${id}`);
        const transformedCategories = response.data.categoryids.map((cat) => ({
          id: cat.category_id,
          name: cat.name,
          description: response.data.description || "Explore this category",
          cover_image: response.data.cover_image,
          items: cat.item_count || 0,
        }));
        setCategories(transformedCategories);
        setCollectionTitle(response.data.title);
        setCollectionDescription(response.data.description || "Explore this collection");
      } catch (err) {
        setError(err.message || "Failed to fetch collection");
      } finally {
        setLoading(false);            // global spinner OFF
        setLocalLoading(false);
      }
    };

    fetchCollection();
  }, [id, setLoading]);

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "https://www.shahumumbai.com";
  const pageUrl = `${baseUrl}/collections/${id}`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
      { "@type": "ListItem", position: 2, name: "Collections", item: `${baseUrl}/collections` },
      { "@type": "ListItem", position: 3, name: collectionTitle, item: pageUrl },
    ],
  };

  const collectionPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collectionTitle,
    url: pageUrl,
    description: collectionDescription,
    image: categories[0]?.cover_image || `${baseUrl}/og/collections.jpg`,
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: categories.map((cat, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: cat.name,
      url: `${pageUrl}#${encodeURIComponent(cat.name)}`,
    })),
  };

  /* ------------------------------------------------------------------ */
  return (
    <Layout>
      <Helmet>
        <title>{collectionTitle} — Shahu Mumbai</title>
        <meta name="description" content={collectionDescription} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`${collectionTitle} — Shahu Mumbai`} />
        <meta property="og:description" content={collectionDescription} />
        <meta property="og:url" content={pageUrl} />
        <meta
          property="og:image"
          content={categories[0]?.cover_image || `${baseUrl}/og/collections.jpg`}
        />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(collectionPageJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(itemListJsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-[#F1E7E5]">
        <div className="text-center mb-8 pt-8">
          <h1 className="text-3xl font-bold text-[#2C1C15]">{collectionTitle}</h1>
          <p className="text-[#6D4C41]">{collectionDescription}</p>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-12">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <CollectionCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : categories.length === 0 ? (
            <p className="text-center text-[#6D4C41]">No categories found.</p>

          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.map((cat) => (
                <CollectionCard key={cat.id} category={cat} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}