import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const AddAdmin = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required.";
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email.";
    if (form.password.length < 8) e.password = "Min 8 characters.";
    if (form.confirm !== form.password) e.confirm = "Passwords do not match.";
    return e;
    };

  const onSubmit = async (e) => {
    e.preventDefault();
    const eMap = validate();
    setErrors(eMap);
    if (Object.keys(eMap).length) return;

    try {
      setSubmitting(true);
      // TODO: call your API here
      // await axios.post('/api/admins', form)
      alert("Admin created (demo). Hook up your API!");
      setForm({ name: "", email: "", password: "", confirm: "" });
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase =
    "w-full rounded-md px-4 py-3 border border-[#E6DCD2] text-[#6B4226] placeholder-[#6B4226]/50 " +
    "focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-[#D4A5A5]";

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      {/* Full Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-[#6B4226] mb-1">
          Full Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={form.name}
          onChange={onChange}
          className={inputBase}
          placeholder="e.g., Aanya Singh"
          autoComplete="name"
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-[#6B4226] mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={onChange}
          className={inputBase}
          placeholder="name@example.com"
          autoComplete="email"
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
      </div>

      {/* Password */}
      <div className="relative">
        <label htmlFor="password" className="block text-sm font-medium text-[#6B4226] mb-1">
          Password
        </label>
        <input
          id="password"
          name="password"
          type={showPwd ? "text" : "password"}
          value={form.password}
          onChange={onChange}
          className={inputBase + " pr-12"}
          placeholder="Min 8 characters"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShowPwd((s) => !s)}
          className="absolute right-3 top-9 text-[#6B4226]/70"
          aria-label={showPwd ? "Hide password" : "Show password"}
        >
          {showPwd ? <FaEyeSlash /> : <FaEye />}
        </button>
        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
      </div>

      {/* Confirm Password */}
      <div className="relative">
        <label htmlFor="confirm" className="block text-sm font-medium text-[#6B4226] mb-1">
          Confirm Password
        </label>
        <input
          id="confirm"
          name="confirm"
          type={showConfirm ? "text" : "password"}
          value={form.confirm}
          onChange={onChange}
          className={inputBase + " pr-12"}
          placeholder="Re-enter password"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShowConfirm((s) => !s)}
          className="absolute right-3 top-9 text-[#6B4226]/70"
          aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
        >
          {showConfirm ? <FaEyeSlash /> : <FaEye />}
        </button>
        {errors.confirm && <p className="mt-1 text-xs text-red-600">{errors.confirm}</p>}
      </div>

      {/* Submit */}
      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#D4A5A5] hover:opacity-90 disabled:opacity-60 text-white px-6 py-3 rounded-md transition font-semibold shadow"
        >
          {submitting ? "Adding…" : "Add Admin"}
        </button>
        <p className="text-xs text-[#6B4226]/60 mt-2">
          Tip: Use a strong, unique password. You can enforce complexity rules server-side.
        </p>
      </div>
    </form>
  );
};

export default AddAdmin;
