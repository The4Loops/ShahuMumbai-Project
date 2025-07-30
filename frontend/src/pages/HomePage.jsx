import React from 'react'
import Layout from '../layout/Layout'

function HomePage() {
  return (
    <Layout>
      Home
    </Layout>
  )
}

export default HomePage

// import React from "react";
// import { Swiper, SwiperSlide } from "swiper/react";
// import "swiper/css";
// import "../styles/homepage.css";
// import Layout from '../layout/Layout'


// const HomePage = () => {
//   return (
//     <Layout>
//     <div className="homepage">
//       {/* Hero Slider */}
//       <div className="hero-slider">
//         <Swiper className="slider">
//           <SwiperSlide>
//             <img src="https://via.placeholder.com/1600x800" alt="Slide 1" className="slide-img" />
//             <div className="slide-caption">
//               <div className="caption-box">
//                 <h2>Fall Winter 2025</h2>
//                 <ul>
//                   <li>Women</li>
//                   <li>Men</li>
//                   <li>Accessories</li>
//                 </ul>
//               </div>
//             </div>
//           </SwiperSlide>
//         </Swiper>
//       </div>

//       {/* Featured Products */}
//       <section className="featured-products">
//         {[...Array(4)].map((_, i) => (
//           <div key={i} className="product">
//             <img src={`https://via.placeholder.com/300x400?text=Product+${i + 1}`} alt="Product" />
//             <p>Product {i + 1}</p>
//           </div>
//         ))}
//       </section>

//       {/* Season Highlights */}
//       <section className="season-highlights">
//         {["Scarves", "Bags & More", "Smart Leather Goods"].map((label, i) => (
//           <div key={i} className="highlight">
//             <img src={`https://via.placeholder.com/400x500?text=${label}`} alt={label} />
//             <h3>Featured Collection</h3>
//             <p>{label}</p>
//           </div>
//         ))}
//       </section>

//       {/* The Look */}
//       <section className="look-section">
//         <img src="https://via.placeholder.com/400x600?text=Model" alt="Model" className="look-img" />
//         <div className="look-items">
//           <h2>The Look</h2>
//           <div className="look-scroll">
//             {["Coat", "Sweater", "Trousers"].map((item, i) => (
//               <div key={i} className="look-item">
//                 <img src={`https://via.placeholder.com/120x160?text=${item}`} alt={item} />
//                 <p>{item}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Promo Banners */}
//       <section className="promo-banners">
//         {[1, 2].map((num) => (
//           <div key={num} className="promo">
//             <img src={`https://via.placeholder.com/600x800?text=Promo+${num}`} alt="Promo" />
//             <div className="promo-text">
//               <h3>Style in the Sun</h3>
//               <p>Discover summer's lightweight designs</p>
//             </div>
//           </div>
//         ))}
//       </section>

//       {/* Artistic Call-to-Action */}
//       <section className="art-cta">
//         <img src="https://via.placeholder.com/300x400?text=Sculpture" alt="Art" />
//         <h3>Come to Life</h3>
//         <a href="/">Discover more</a>
//       </section>

//       {/* Service Icons */}
//       <section className="services">
//         {[
//           "Free Shipping",
//           "Personalized Packaging",
//           "In-store Appointments",
//           "Customer Care",
//         ].map((service, i) => (
//           <div key={i} className="service">
//             <img src={`https://via.placeholder.com/60?text=Icon`} alt="Icon" />
//             <p>{service}</p>
//           </div>
//         ))}
//       </section>

//       {/* Editorial Grid */}
//       <section className="editorial">
//         {[1, 2, 3, 4].map((num) => (
//           <div key={num} className="editorial-card">
//             <img src={`https://via.placeholder.com/300x300?text=Story+${num}`} alt={`Story ${num}`} />
//             <h4>Inside Look {num}</h4>
//             <p>Short description of the editorial story goes here.</p>
//           </div>
//         ))}
//       </section>
//     </div>
//     </Layout>
//   );
// };

// export default HomePage;
