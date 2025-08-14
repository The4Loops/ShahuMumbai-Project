// src/admin/Communications.jsx
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { FaSearch, FaInbox, FaEnvelope, FaUser, FaClock, FaCheckCircle, FaTimes } from 'react-icons/fa';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;
const PAGE_SIZE = 12;

const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : '');

const StatusBadge = ({ status }) => {
  const s = (status || 'new').toLowerCase();
  const map = {
    new: 'bg-blue-100 text-blue-700',
    read: 'bg-gray-100 text-gray-700',
    resolved: 'bg-green-100 text-green-700',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[s] || map.new}`}>{s}</span>;
};

export default function Communications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null); // selected item object
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Load list
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await axios.get(`${BASE_URL}/api/customer-messages`);
        if (!cancelled) {
          setItems(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        // Demo fallback
        if (!cancelled) {
          setError('Could not reach API. Showing sample messages.');
          setItems([
            {
              id: 1,
              name: 'Aisha Khan',
              email: 'aisha@example.com',
              message:
                "Hi team,\nI received Order #2471 but the size is a bit small. Could I exchange for M?\nThanks!",
              createdAt: new Date().toISOString(),
              status: 'new',
            },
            {
              id: 2,
              name: 'Karan Patel',
              email: 'karan.p@example.com',
              message:
                'Hello, I think my card was charged twice for the same purchase yesterday. Please check.',
              createdAt: new Date(Date.now() - 6 * 3600e3).toISOString(),
              status: 'read',
            },
            {
              id: 3,
              name: 'Meera Shah',
              email: 'meera.s@example.com',
              message:
                'My delivery shows “attempted” but I was home. Can you reschedule or share the courier contact?',
              createdAt: new Date(Date.now() - 2 * 86400e3).toISOString(),
              status: 'resolved',
            },
          ]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter + sort
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? items.filter(
          (m) =>
            m.name?.toLowerCase().includes(q) ||
            m.email?.toLowerCase().includes(q) ||
            m.message?.toLowerCase().includes(q)
        )
      : items;
    return base.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [items, query]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageSlice = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  useEffect(() => setPage(1), [query]);

  // Actions
  const markRead = async (id) => {
    setActionLoading(true);
    try {
      await axios.post(`${BASE_URL}/api/customer-messages/${id}/read`);
    } catch {}
    setItems((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'read' } : m)));
    setActionLoading(false);
  };

  const setStatus = async (id, status) => {
    setActionLoading(true);
    try {
      await axios.patch(`${BASE_URL}/api/customer-messages/${id}/status`, { status });
    } catch {}
    setItems((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    setSelected((sel) => (sel && sel.id === id ? { ...sel, status } : sel));
    setActionLoading(false);
  };

  return (
    <div className="font-serif">
      <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-[#6B4226]">Customer Messages</h2>
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="pl-9 pr-3 py-2 rounded-lg border border-[#D4A5A5] focus:outline-none focus:ring-2 focus:ring-[#D4A5A5]"
            placeholder="Search name, email, message…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md border border-yellow-300 bg-yellow-50 text-yellow-800">{error}</div>
      )}

      <div className="border border-[#D4A5A5] bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 border-b bg-[#f9f5f0] text-[#6B4226] font-semibold">Inbox</div>

        {loading ? (
          <div className="p-6 text-gray-500">Loading…</div>
        ) : pageSlice.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <FaInbox className="mx-auto mb-2 text-2xl" />
            No messages found
          </div>
        ) : (
          <ul className="divide-y">
            {pageSlice.map((m) => (
              <li key={m.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#6B4226] truncate">{m.name || 'Customer'}</span>
                      <span className="text-xs text-gray-500 truncate">&lt;{m.email}&gt;</span>
                      <StatusBadge status={m.status} />
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2 mt-1 whitespace-pre-line">{m.message}</p>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <FaClock /> {fmt(m.createdAt)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {m.status === 'new' && (
                      <button
                        onClick={() => markRead(m.id)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 text-sm rounded border border-[#D4A5A5] hover:bg-[#f3dede] disabled:opacity-50"
                      >
                        Mark Read
                      </button>
                    )}
                    {m.status !== 'resolved' ? (
                      <button
                        onClick={() => setStatus(m.id, 'resolved')}
                        disabled={actionLoading}
                        className="px-3 py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 inline-flex items-center gap-1"
                      >
                        <FaCheckCircle /> Resolve
                      </button>
                    ) : (
                      <button
                        onClick={() => setStatus(m.id, 'new')}
                        disabled={actionLoading}
                        className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        Reopen
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelected(m);
                        // auto-mark read when opened
                        if (m.status === 'new') markRead(m.id);
                      }}
                      className="px-3 py-1.5 text-sm rounded bg-black text-white hover:bg-gray-800"
                    >
                      Open
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t flex items-center justify-between text-sm">
            <button
              className="px-3 py-1 rounded border border-[#D4A5A5] disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pageSafe === 1}
            >
              Prev
            </button>
            <span className="text-gray-700">
              Page {pageSafe} of {totalPages}
            </span>
            <button
              className="px-3 py-1 rounded border border-[#D4A5A5] disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={pageSafe === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Modal that mirrors your CustomerServicePopup style */}
      {selected && (
        <AdminMessageModal
          item={selected}
          onClose={() => setSelected(null)}
          onResolve={() => setStatus(selected.id, 'resolved')}
        />
      )}
    </div>
  );
}

// --- Modal component styled like your CustomerServicePopup ---
function AdminMessageModal({ item, onClose, onResolve }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg max-w-4xl w-full mx-4 overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Customer Message</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        {/* Content (mirrors your popup style) */}
        <div className="p-6">
          <p className="text-lg text-gray-600 mb-8 text-center">
            This is exactly what the customer submitted via the Customer Service page.
          </p>

          {/* Info cards (similar to Phone/Email/Address section, but with Name/Email/Time) */}
          <div className="grid gap-8 md:grid-cols-3 mb-12">
            <div className="bg-gray-50 rounded-xl shadow p-6 text-center">
              <FaUser className="mx-auto text-3xl text-gray-700 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Name</h3>
              <p className="text-gray-700 break-words">{item.name || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl shadow p-6 text-center">
              <FaEnvelope className="mx-auto text-3xl text-gray-700 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Email</h3>
              <p className="text-gray-700 break-words">{item.email || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl shadow p-6 text-center">
              <FaClock className="mx-auto text-3xl text-gray-700 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Submitted</h3>
              <p className="text-gray-700">{fmt(item.createdAt)}</p>
            </div>
          </div>

          {/* Message block (mirrors the form’s message area) */}
          <div className="bg-gray-50 rounded-xl shadow p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Message</label>
              <div className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-3 bg-white whitespace-pre-wrap">
                {item.message}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={onResolve}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors inline-flex items-center justify-center gap-2"
              >
                <FaCheckCircle /> Mark Resolved
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-black text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors inline-flex items-center justify-center gap-2"
              >
                <FaTimes /> Close
              </button>
            </div>
          </div>

          {/* (Optional) Quick reply idea:
              You can add a reply textarea here to email the customer or push a response to their account inbox.
              Kept out for now since you asked for parity with the submitted form. */}
        </div>
      </div>
    </div>
  );
}
