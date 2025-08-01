import React from 'react';

function Newsletter() {
  return (
    <section style={{ backgroundColor: '#fdf6e9' }} className="text-black py-20 px-6 text-center">
      <div className="max-w-xl mx-auto">
        <div className="text-4xl mb-4">📧</div>
        <h2 className="text-2xl font-semibold mb-2">Stay in the Loop</h2>
        <p className="mb-6">Be the first to discover new vintage treasures and exclusive collections.</p>
        <div className="bg-white rounded-lg shadow p-4">
          <label htmlFor="newsletter-email" className="sr-only">Email address</label>
          <input
            id="newsletter-email"
            type="email"
            placeholder="Enter your email address"
            className="w-full p-2 border rounded mb-4 text-black"
          />
          <button className="bg-pink-600 text-white px-6 py-2 rounded-lg w-full">Subscribe to Newsletter</button>
          <p className="text-xs text-gray-500 mt-2">We respect your privacy. Unsubscribe at any time.</p>
        </div>
      </div>
    </section>
  );
}

export default Newsletter;
