import React, { useState } from 'react';

function Newsletter({ collapsible = false, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      style={{ backgroundColor: '#F1E7E5' }}
      className="text-[#6B4226] px-6 py-16 mt-12" // ← fixed padding
    >
      <div className="max-w-xl mx-auto">
        {/* Collapsible header bar */}
        {collapsible && (
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="w-full flex items-center justify-between bg-white border border-[#E6DCD2] rounded-lg px-4 py-2 text-left" // ← no mt here
          >
            <span className="font-semibold">
              {open ? 'Hide newsletter signup' : 'Get updates – join our newsletter'}
            </span>
            <span className="text-xl leading-none">{open ? '−' : '+'}</span>
          </button>
        )}

        {/* Constant gap below the button so it never shifts */}
        <div className="mt-4">
          {/* Collapsible content; only max-height changes */}
          <div
            className={`overflow-hidden transition-[max-height] duration-300 ${collapsible ? (open ? 'max-h-[600px]' : 'max-h-0') : ''}`}
          >
            {!collapsible && <div className="text-4xl mb-4">📧</div>}
            {collapsible && <div className="text-4xl mb-4 text-center">📧</div>}

            <h2 className="text-2xl font-semibold mb-2 text-center">Stay in the Loop</h2>
            <p className="mb-6 text-[#6B4226]/70 text-center">
              Be the first to discover new vintage treasures and exclusive collections.
            </p>

            <div className="bg-white rounded-lg shadow p-4 border border-[#E6DCD2]">
              <label htmlFor="newsletter-email" className="sr-only">Email address</label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="Enter your email address"
                className="w-full p-2 border border-[#D4A5A5] rounded mb-4 text-[#6B4226] placeholder-[#6B4226]/50 focus:outline-none focus:border-[#D4A5A5]"
              />
              <button className="bg-[#D4A5A5] text-white px-6 py-2 rounded-full w-full hover:opacity-90 transition">
                Subscribe to Newsletter
              </button>
              <p className="text-xs text-[#6B4226]/60 mt-2 text-center">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Newsletter;
