import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");

const AddBlogPost = () => {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [cover, setCover] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState(""); // comma-separated
  const [status, setStatus] = useState("DRAFT"); // DRAFT | PUBLISHED
  const [publishAt, setPublishAt] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // (Optional) replace with real categories from API later
  const categories = useMemo(
    () => ["Announcements", "Guides", "Releases", "Behind the Scenes"],
    []
  );

  // Detect mobile
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 1024);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Auto-slug from title until user edits slug manually
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  const onPickCover = (e) => {
    const file = e.target.files?.[0];
    setCover(file || null);
    if (file) {
      const url = URL.createObjectURL(file);
      setCoverPreview(url);
    } else {
      setCoverPreview(null);
    }
  };

  const validate = () => {
    if (!title.trim()) return "Title is required.";
    if (!slug.trim()) return "Slug is required.";
    if (!excerpt.trim()) return "Excerpt is required.";
    if (!content.trim()) return "Content is required.";
    if (!category) return "Please select a category.";
    return null;
  };

  const handleSubmit = async (publishNow = false) => {
    const err = validate();
    if (err) {
      setMessage({ type: "error", text: err });
      return;
    }
    setSubmitting(true);
    setMessage(null);

    try {
      const form = new FormData();
      form.append("title", title.trim());
      form.append("slug", slug.trim());
      form.append("excerpt", excerpt.trim());
      form.append("content", content);
      if (cover) form.append("cover", cover); // expects multipart on backend
      form.append("category", category);
      form.append(
        "tags",
        JSON.stringify(
          tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        )
      );
      form.append("status", publishNow ? "PUBLISHED" : status);
      if (publishAt) form.append("publishAt", publishAt);
      form.append("metaTitle", metaTitle.trim());
      form.append("metaDescription", metaDescription.trim());

      // TODO: adjust base URL/path to match your API
      await axios.post("/api/blogs", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage({ type: "success", text: "Blog post saved successfully." });
      // reset form
      setTitle("");
      setSlug("");
      setSlugTouched(false);
      setExcerpt("");
      setContent("");
      setCover(null);
      setCoverPreview(null);
      setCategory("");
      setTags("");
      setStatus("DRAFT");
      setPublishAt("");
      setMetaTitle("");
      setMetaDescription("");
    } catch (e) {
      setMessage({
        type: "error",
        text:
          e?.response?.data?.detail ||
          "Failed to save the blog post. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase =
    "w-full border border-[#D4A5A5] rounded-md px-3 py-3 focus:outline-none focus:ring-2 focus:ring-[#D4A5A5]";

  return (
    <div className="font-serif">
      <h2 className="text-2xl lg:text-3xl font-bold text-[#6B4226] mb-4 lg:mb-6">
        Add Blog Post
      </h2>

      {message && (
        <div
          className={`mb-4 lg:mb-6 rounded-md px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-red-100 text-red-800 border border-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[#6B4226] mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputBase}
              placeholder="Enter a compelling headline"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-[#6B4226] mb-1">
              Slug *
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(slugify(e.target.value));
                setSlugTouched(true);
              }}
              className={inputBase}
              placeholder="auto-generated-from-title"
              inputMode="latin"
            />
            <p className="text-xs text-[#6B4226]/70 mt-1 break-all">
              URL: <i>/blog/{slug || "your-slug"}</i>
            </p>
          </div>

          {/* Excerpt */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-[#6B4226] mb-1">
                Excerpt *
              </label>
              <span className="text-xs text-[#6B4226]/60">
                {excerpt.length}/160
              </span>
            </div>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value.slice(0, 160))}
              rows={3}
              className={inputBase}
              placeholder="Short summary shown on listing cards"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-[#6B4226] mb-1">
              Content *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={isMobile ? 10 : 12}
              className={inputBase}
              placeholder="Write your post content (Markdown supported if your backend parses it)"
            />
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-4 lg:space-y-6">
          {/* Cover image */}
          <div>
            <label className="block text-sm font-medium text-[#6B4226] mb-2">
              Cover Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={onPickCover}
              className="w-full text-sm"
            />
            {coverPreview && (
              <img
                src={coverPreview}
                alt="Cover Preview"
                className="mt-3 rounded-md border border-[#D4A5A5] max-h-56 object-cover w-full"
              />
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-[#6B4226] mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`${inputBase} bg-white`}
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-[#6B4226] mb-1">
              Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className={inputBase}
              placeholder="e.g. coffee, brewing, guides"
            />
            <p className="text-xs text-[#6B4226]/70 mt-1">
              Separate tags with commas.
            </p>
          </div>

          {/* Status & schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#6B4226] mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`${inputBase} bg-white`}
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#6B4226] mb-1">
                Publish At (optional)
              </label>
              <input
                type="datetime-local"
                value={publishAt}
                onChange={(e) => setPublishAt(e.target.value)}
                className={inputBase}
              />
              <p className="text-xs text-[#6B4226]/70 mt-1">
                Leave empty to publish immediately.
              </p>
            </div>
          </div>

          {/* SEO */}
          <div className="pt-2 border-t border-[#D4A5A5]">
            <h3 className="text-sm font-semibold text-[#6B4226] mb-3">
              SEO (optional)
            </h3>
            <label className="block text-sm text-[#6B4226] mb-1">
              Meta Title
            </label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className={inputBase + " mb-3"}
              placeholder="Override page title for SEO"
            />
            <div className="flex items-center justify-between">
              <label className="block text-sm text-[#6B4226] mb-1">
                Meta Description
              </label>
              <span className="text-xs text-[#6B4226]/60">
                {metaDescription.length}/160
              </span>
            </div>
            <textarea
              rows={3}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value.slice(0, 160))}
              className={inputBase}
              placeholder="Short description for search engines"
            />
          </div>
        </div>
      </div>

      {/* Actions (desktop) */}
      <div className="mt-6 lg:mt-8 hidden sm:flex flex-wrap gap-3">
        <button
          disabled={submitting}
          onClick={() => handleSubmit(false)}
          className="px-5 py-2.5 rounded-md border border-[#D4A5A5] text-[#6B4226] hover:bg-[#f3dede] disabled:opacity-60"
        >
          Save as Draft
        </button>
        <button
          disabled={submitting}
          onClick={() => handleSubmit(true)}
          className="px-5 py-2.5 rounded-md bg-[#D4A5A5] text-white hover:opacity-90 disabled:opacity-60"
        >
          Publish
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => {
            setTitle("");
            setSlug("");
            setSlugTouched(false);
            setExcerpt("");
            setContent("");
            setCover(null);
            setCoverPreview(null);
            setCategory("");
            setTags("");
            setStatus("DRAFT");
            setPublishAt("");
            setMetaTitle("");
            setMetaDescription("");
            setMessage(null);
          }}
          className="px-5 py-2.5 rounded-md border border-[#D4A5A5] text-[#6B4226] hover:bg-[#f3dede] disabled:opacity-60"
        >
          Reset
        </button>
      </div>

      {/* Sticky action bar (mobile) */}
      <div className="sm:hidden">
        <div className="h-16" />
        <div className="fixed left-0 right-0 bottom-0 z-20 bg-white/95 backdrop-blur border-t border-[#E6DCD2] px-4 py-[10px] flex items-center gap-2 justify-between"
             style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)" }}>
          <button
            disabled={submitting}
            onClick={() => handleSubmit(false)}
            className="flex-1 px-4 py-2 rounded-md border border-[#D4A5A5] text-[#6B4226] disabled:opacity-60"
          >
            Draft
          </button>
          <button
            disabled={submitting}
            onClick={() => handleSubmit(true)}
            className="flex-[1.2] px-4 py-2 rounded-md bg-[#D4A5A5] text-white disabled:opacity-60"
          >
            Publish
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => {
              setTitle("");
              setSlug("");
              setSlugTouched(false);
              setExcerpt("");
              setContent("");
              setCover(null);
              setCoverPreview(null);
              setCategory("");
              setTags("");
              setStatus("DRAFT");
              setPublishAt("");
              setMetaTitle("");
              setMetaDescription("");
              setMessage(null);
            }}
            className="px-3 py-2 rounded-md border border-[#E6DCD2] text-[#6B4226] disabled:opacity-60"
            title="Reset"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddBlogPost;
