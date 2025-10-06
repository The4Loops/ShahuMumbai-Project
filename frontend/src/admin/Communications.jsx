import React, { useEffect, useMemo, useState } from 'react';
import api from '../supabase/axios';
import { FaSearch, FaInbox, FaEnvelope, FaUser, FaClock, FaCheckCircle, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify'; // Added for error/success messages

const BASE_URL = process.env.REACT_APP_API_BASE_URL;
const PAGE_SIZE = 12;

const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : '');

const StatusBadge = ({ status }) => {
  const s = (status || 'pending').toLowerCase();
  const map = {
    pending: 'bg-blue-100 text-blue-700',
    read: 'bg-gray-100 text-gray-700',
    resolved: 'bg-green-100 text-green-700',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[s] || map.pending}`}>{s}</span>;
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
        const { data } = await api.get(`/api/contacts`, {
          params: {
            q: query.trim() || undefined,
            limit: PAGE_SIZE,
            offset: (page - 1) * PAGE_SIZE,
          },
        });
        if (!cancelled) {
          setItems(Array.isArray(data.contacts) ? data.contacts : []);
        }
      } catch (e) {
        if (!cancelled) {
          setError('Could not reach API. Showing sample messages.');
          toast.error('Failed to load messages.');
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [query, page]);

  // Filter + sort (client-side fallback)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? items.filter(
          (m) =>
            m.Name?.toLowerCase().includes(q) ||
            m.Email?.toLowerCase().includes(q) ||
            m.Message?.toLowerCase().includes(q) ||
            m.Subject?.toLowerCase().includes(q)
        )
      : items;
    return base.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
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
      const { data } = await api.put(`/api/contacts/${id}`, { status: 'read' });
      setItems((prev) => prev.map((m) => (m.id === id ? { ...m, status: data.Status } : m)));
      toast.success('Message marked as read.');
    } catch (e) {
      toast.error('Failed to mark message as read.');
    }
    setActionLoading(false);
  };

  const setStatus = async (id, status) => {
    setActionLoading(true);
    try {
      const { data } = await api.put(`/api/contacts/${id}`, { status });
      setItems((prev) => prev.map((m) => (m.id === id ? { ...m, status: data.Status } : m)));
      setSelected((sel) => (sel && sel.id === id ? { ...sel, status: data.Status } : sel));
      toast.success(`Message marked as ${status}.`);
    } catch (e) {
      toast.error(`Failed to mark message as ${status}.`);
    }
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
            placeholder="Search name, email, subject, message…"
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
                      <span className="font-semibold text-[#6B4226] truncate">{m.Name || 'Customer'}</span>
                      <span className="text-xs text-gray-500 truncate">&lt;{m.Email}&gt;</span>
                      <StatusBadge status={m.Status} />
                    </div>
                    <p className="text-sm text-gray-700 truncate mt-1">{m.Subject || 'No Subject'}</p>
                    <p className="text-sm text-gray-700 line-clamp-2 mt-1 whitespace-pre-line">{m.Message}</p>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <FaClock /> {fmt(m.CreatedAt)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {m.Status === 'pending' && (
                      <button
                        onClick={() => markRead(m.ContactUsId)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 text-sm rounded border border-[#D4A5A5] hover:bg-[#f3dede] disabled:opacity-50"
                      >
                        Mark Read
                      </button>
                    )}
                    {m.Status !== 'resolved' ? (
                      <button
                        onClick={() => setStatus(m.ContactUsId, 'resolved')}
                        disabled={actionLoading}
                        className="px-3 py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 inline-flex items-center gap-1"
                      >
                        <FaCheckCircle /> Resolve
                      </button>
                    ) : (
                      <button
                        onClick={() => setStatus(m.ContactUsId, 'pending')}
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
                        if (m.Status === 'pending') markRead(m.ContactUsId);
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

      {/* Modal */}
      {selected && (
        <AdminMessageModal
          item={selected}
          onClose={() => setSelected(null)}
          onResolve={() => setStatus(selected.ContactUsId, 'resolved')}
        />
      )}
    </div>
  );
}

// --- Modal component ---
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

        {/* Content */}
        <div className="p-6">
          <p className="text-lg text-gray-600 mb-8 text-center">
            This is exactly what the customer submitted via the Contact page.
          </p>

          {/* Info cards */}
          <div className="grid gap-8 md:grid-cols-3 mb-12">
            <div className="bg-gray-50 rounded-xl shadow p-6 text-center">
              <FaUser className="mx-auto text-3xl text-gray-700 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Name</h3>
              <p className="text-gray-700 break-words">{item.Name || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl shadow p-6 text-center">
              <FaEnvelope className="mx-auto text-3xl text-gray-700 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Email</h3>
              <p className="text-gray-700 break-words">{item.Email || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl shadow p-6 text-center">
              <FaClock className="mx-auto text-3xl text-gray-700 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Submitted</h3>
              <p className="text-gray-700">{fmt(item.CreatedAt)}</p>
            </div>
          </div>

          {/* Message block */}
          <div className="bg-gray-50 rounded-xl shadow p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject</label>
              <div className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-3 bg-white">
                {item.Subject || 'No Subject'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Message</label>
              <div className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-3 bg-white whitespace-pre-wrap">
                {item.Message || 'No Message'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <div className="mt-1">
                <StatusBadge status={item.Status} />
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
        </div>
      </div>
    </div>
  );
}