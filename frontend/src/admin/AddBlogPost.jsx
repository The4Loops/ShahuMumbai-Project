// AddBlogPost.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../supabase/axios";
import { toast } from "react-toastify";
import { useLocation, useParams } from "react-router-dom";

const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");

const safeParseJSON = (s) => {
  try { return JSON.parse(s); } catch { return []; }
};

const normalizeBlog = (raw) => {
  if (!raw) return null;
  return {
    BlogId: raw.BlogId ?? raw.id ?? raw.blogId ?? null,
    Title: raw.Title ?? raw.title ?? "",
    Slug: raw.Slug ?? raw.slug ?? "",
    Excerpt: raw.Excerpt ?? raw.excerpt ?? "",
    Content: raw.Content ?? raw.content ?? "",
    CoverImage: raw.CoverImage ?? raw.cover_image ?? null,
    Category: raw.Category ?? raw.category ?? "",
    Tags: Array.isArray(raw.Tags)
      ? raw.Tags
      : Array.isArray(raw.tags)
      ? raw.tags
      : typeof raw.Tags === "string"
      ? safeParseJSON(raw.Tags)
      : typeof raw.tags === "string"
      ? safeParseJSON(raw.tags)
      : [],
    Status: (raw.Status ?? raw.status ?? "DRAFT").toUpperCase(),
    PublishAt: raw.PublishAt ?? raw.publish_at ?? raw.publishAt ?? "",
    MetaTitle: raw.MetaTitle ?? raw.meta_title ?? "",
    MetaDescription: raw.MetaDescription ?? raw.meta_description ?? "",
  };
};

const AddBlogPost = () => {
  const location = useLocation();
  const { id } = useParams();

  const [loading, setLoading] = useState(false);

  const editingBlog = location.state?.blog || null;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [cover, setCover] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [publishAt, setPublishAt] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [selectedDraftId, setSelectedDraftId] = useState(null);

  const categories = useMemo(
    () => ["Announcements", "Guides", "Releases", "Behind the Scenes"],
    []
  );

  useEffect(() => {
    if (editingBlog) {
      prefillForm(normalizeBlog(editingBlog));
    }
  }, [editingBlog]);

  useEffect(() => {
    const fetchBlogById = async () => {
      if (!id || editingBlog) return;
      setLoading(true);
      try {
        const response = await api.get(`/api/blogs/${id}`);
        prefillForm(normalizeBlog(response.data));
      } catch (err) {
        toast.error("Failed to load blog for editing.");
      } finally {
        setLoading(false);
      }
    };
    fetchBlogById();
  }, [id, editingBlog]);

  const prefillForm = (blog) => {
    if (!blog) return;
    setSelectedDraftId(blog.BlogId || null);
    setTitle(blog.Title || "");
    setSlug(blog.Slug || "");
    setSlugTouched(true);
    setExcerpt(blog.Excerpt || "");
    setContent(blog.Content || "");
    setCoverPreview(blog.CoverImage || null);
    setCategory(blog.Category || "");
    setTags(Array.isArray(blog.Tags) ? blog.Tags.join(", ") : (blog.Tags || ""));
    setStatus((blog.Status || "DRAFT").toUpperCase());
    setPublishAt(blog.PublishAt || "");
    setMetaTitle(blog.MetaTitle || "");
    setMetaDescription(blog.MetaDescription || "");
  };

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 1024);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      const response = await api.get("/api/blogs/drafts");
      setDrafts(response.data);
    } catch (err) {
      toast.error("Failed to fetch drafts.");
    }
  };

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

  const uploadCoverImage = async () => {
    if (!cover) return null;
    const formData = new FormData();
    formData.append("image", cover);
    try {
      const response = await api.post("/api/upload/single", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.url;
    } catch (err) {
      toast.error("Failed to upload cover image.");
      throw new Error("Failed to upload cover image");
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
      toast.error(err);
      return;
    }
    setSubmitting(true);

    try {
      let coverImageUrl = null;
      if (cover) {
        coverImageUrl = await uploadCoverImage();
      } else if (selectedDraftId && coverPreview) {
        coverImageUrl = coverPreview;
      }

      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim(),
        content,
        category,
        tags: JSON.stringify(
          tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        ),
        status: publishNow ? "PUBLISHED" : status,
        publish_at: publishNow && publishAt ? publishAt : null,
        meta_title: metaTitle.trim() || null,
        meta_description: metaDescription.trim() || null,
        cover_image: coverImageUrl,
      };

      const url = selectedDraftId
        ? `/api/admin/blogs/${selectedDraftId}`
        : "/api/admin/blogs";
      const method = selectedDraftId ? "put" : "post";

      await api({
        method,
        url,
        data: payload,
        headers: { "Content-Type": "application/json" },
      });

      toast.success("Blog post saved successfully.");
      handleReset();
      fetchDrafts();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      toast.error(
        e?.response?.data?.detail ||
          "Failed to save the blog post. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
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
    setSelectedDraftId(null);
  };

  const loadDraft = (draft) => {
    prefillForm(normalizeBlog(draft));
  };

  if (loading) return <p className="p-6">Loading blog...</p>;

  return (
    <div className="font-serif p-6">
      <h2 className="text-2xl lg:text-3xl font-bold text-[#6B4226] mb-6">
        {id || editingBlog ? "Edit Blog Post" : "Add Blog Post"}
      </h2>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <label className="block font-medium">Title</label>
          <input
            className="w-full border rounded p-2 mb-3"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <label className="block font-medium">Slug</label>
          <input
            className="w-full border rounded p-2 mb-3"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
          />

          <label className="block font-medium">Excerpt</label>
          <textarea
            className="w-full border rounded p-2 mb-3"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
          />

          <label className="block font-medium">Content</label>
          <textarea
            className="w-full border rounded p-2 mb-3 min-h-[150px]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <label className="block font-medium">Category</label>
          <select
            className="w-full border rounded p-2 mb-3"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <label className="block font-medium">Tags (comma separated)</label>
          <input
            className="w-full border rounded p-2 mb-3"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />

          <label className="block font-medium">Cover Image</label>
          <input
            type="file"
            accept="image/*"
            className="mb-3"
            onChange={onPickCover}
          />
          {coverPreview && (
            <img
              src={coverPreview}
              alt="Cover Preview"
              className="w-full h-48 object-cover rounded mb-3"
            />
          )}
        </div>

        <div>
          <label className="block font-medium">Status</label>
          <select
            className="w-full border rounded p-2 mb-3"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>

          <label className="block font-medium">Publish At</label>
          <input
            type="datetime-local"
            className="w-full border rounded p-2 mb-3"
            value={publishAt}
            onChange={(e) => setPublishAt(e.target.value)}
          />

          <label className="block font-medium">Meta Title</label>
          <input
            className="w-full border rounded p-2 mb-3"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
          />

          <label className="block font-medium">Meta Description</label>
          <textarea
            className="w-full border rounded p-2 mb-3"
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
          />

          <div className="flex gap-3">
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="bg-yellow-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              onClick={() => handleSubmit(true)}
              disabled={submitting}
              className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Publish
            </button>
            <button
              onClick={handleReset}
              className="bg-gray-400 text-white px-4 py-2 rounded"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {drafts.length > 0 && (
        <div className="mt-6">
          <h3 className="font-bold mb-2">Load Draft</h3>
          <ul className="space-y-2">
            {drafts.map((d) => (
              <li key={d.BlogId}>
                <button
                  className="underline text-blue-600"
                  onClick={() => loadDraft(d)}
                >
                  {d.Title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AddBlogPost;
