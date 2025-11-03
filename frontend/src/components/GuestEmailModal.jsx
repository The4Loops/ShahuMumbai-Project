// components/GuestEmailModal.jsx
import React, { useState } from "react";

export default function GuestEmailModal({ open, onClose, onSubmit }) {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");

  if (!open) return null;

  const validate = (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate(email)) {
      setErr("Please enter a valid email address.");
      return;
    }
    setErr("");
    onSubmit(String(email).trim());
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-xl">
        <h3 className="text-lg font-semibold mb-3 text-[#6B4226]">
          Continue as Guest
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Enter your email to receive your order confirmation and updates.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-md px-3 py-2 mb-2"
            placeholder="you@example.com"
            autoFocus
          />
          {err && <div className="text-red-600 text-sm mb-2">{err}</div>}

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-md border"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-2 rounded-md bg-[#6B4226] text-white hover:opacity-90"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
