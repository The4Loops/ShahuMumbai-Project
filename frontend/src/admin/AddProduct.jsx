import { useEffect, useMemo, useState } from "react";
import api from "../supabase/axios";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Select from "react-select";

const PRODUCT_GET_URL = (id) => `/api/products/${id}`;
const PRODUCT_CREATE_URL = `/api/products`;
const PRODUCT_UPDATE_URL = (id) => `/api/products/${id}`;

// --- tiny color helpers ---
const isHex = (s) => /^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(s.trim());
const isCssNamed = (s) => /^[a-z][a-z0-9\s-]*$/i.test(s.trim());
const normalizeColor = (s) => s.trim();

// --- extract URLs from many backend shapes ---
const asArray = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);
const extractUrlsFromUnknown = (payload) => {
  // direct arrays of strings
  if (Array.isArray(payload) && payload.every((x) => typeof x === "string")) return payload;

  // arrays of objects with a URL-ish key
  if (Array.isArray(payload) && payload.length && typeof payload[0] === "object") {
    const keys = ["url", "image_url", "Location", "location", "path", "publicUrl", "public_url"];
    const urls = payload
      .map((obj) => {
        for (const k of keys) {
          if (typeof obj[k] === "string") return obj[k];
        }
        return null;
      })
      .filter(Boolean);
    if (urls.length) return urls;
  }

  // single string
  if (typeof payload === "string") return [payload];

  return [];
};
const extractImageUrls = (resp) => {
  const d = resp?.data ?? resp;

  // try common keys
  const candidates = [
    d?.imageUrls,
    d?.urls,
    d?.images,
    d?.files,
    d?.data?.imageUrls,
    d?.data?.urls,
    d?.data?.images,
    d?.data?.files,
  ];

  for (const c of candidates) {
    const urls = extractUrlsFromUnknown(c);
    if (urls.length) return urls;
  }

  // last resort: if the whole payload itself encodes URLs
  const fallback = extractUrlsFromUnknown(d);
  if (fallback.length) return fallback;

  return [];
};

const AddProduct = ({ editId = null, onSaved }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    trigger,
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      shortdescription: "",
      categoryid: "",
      branddesigner: "",
      price: "",
      discountprice: "",
      stock: 0,
      isactive: true,
      isfeatured: false,
      collection_id: null,
      colors: [],
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [heroImageIndex, setHeroImageIndex] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [collections, setCollections] = useState([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [existingImages, setExistingImages] = useState([]);
  const [colorInput, setColorInput] = useState("");

  // Load categories
  useEffect(() => {
    (async () => {
      try {
        setLoadingCats(true);
        const { data } = await api.get("/api/category");
        setCategories(data || []);
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to fetch categories");
      } finally {
        setLoadingCats(false);
      }
    })();
  }, []);

  // Load collections
  useEffect(() => {
    (async () => {
      try {
        setLoadingCollections(true);
        const { data } = await api.get("/api/admin/collections");
        setCollections(Array.isArray(data) ? data : data?.collections || []);
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to fetch collections");
      } finally {
        setLoadingCollections(false);
      }
    })();
  }, []);

  // If editing: fetch product and prefill
  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const { data } = await api.get(PRODUCT_GET_URL(editId));
        const p = data || {};
        const normalizedColors = Array.isArray(p.colors) ? p.colors : [];

        reset({
          name: p.name ?? "",
          description: p.description ?? "",
          shortdescription: p.shortdescription ?? "",
          categoryid: p.categoryid ?? "",
          branddesigner: p.branddesigner ?? "",
          price: p.price ?? "",
          discountprice: p.discountprice ?? "",
          stock: p.stock ?? 0,
          isactive: !!p.isactive,
          isfeatured: !!p.isfeatured,
          collection_id: p.collectionid ?? null,
          colors: normalizedColors,
        });

        const imgs = (p.product_images || []).map((img) => ({
          url: img.image_url || "",
          is_hero: !!img.is_hero,
        }));
        setExistingImages(imgs);

        const heroIdx = imgs.findIndex((i) => i.is_hero);
        setHeroImageIndex(heroIdx >= 0 ? heroIdx : null);
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to load product");
      }
    })();
  }, [editId, reset]);

  // Previews
  useEffect(() => {
    previews.forEach((url) => URL.revokeObjectURL(url));
    const urls = selectedImages.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedImages]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages(files);
    setHeroImageIndex(null);
  };

  const price = watch("price");
  const discountprice = watch("discountprice");
  const categoryid = watch("categoryid");
  const collection_id = watch("collection_id");
  const colors = watch("colors") || [];

  // color tag actions
  const addColor = () => {
    const raw = colorInput;
    if (!raw || !raw.trim()) return;
    const candidate = normalizeColor(raw);
    const valid = isHex(candidate) || isCssNamed(candidate);
    if (!valid) {
      toast.error("Use a valid hex (#173F5F) or a CSS color name (e.g., navy).");
      return;
    }
    if (colors.map((c) => c.toLowerCase()).includes(candidate.toLowerCase())) {
      toast.info("Color already added.");
      return;
    }
    const next = [...colors, candidate];
    setValue("colors", next, { shouldDirty: true });
    setColorInput("");
  };

  const removeColor = (idx) => {
    const next = colors.filter((_, i) => i !== idx);
    setValue("colors", next, { shouldDirty: true });
  };

  const onSubmit = async (form) => {
    setIsSubmitting(true);
    toast.dismiss();

    try {
      if (!editId) {
        if (selectedImages.length === 0) throw new Error("At least one image is required");
        if (heroImageIndex === null) throw new Error("Please select a hero image");
      }

      // Upload new images if present
      let newImagePayload = null;
      if (selectedImages.length > 0) {
        const formData = new FormData();
        selectedImages.forEach((file) => formData.append("images", file));

        let imageUrls = [];
        try {
          // Let axios set the Content-Type with proper boundary
          const uploadResponse = await api.post("/api/upload/multiple", formData);
          imageUrls = extractImageUrls(uploadResponse);

          if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
            // Show server payload for diagnosis
            // eslint-disable-next-line no-console
            console.error("Upload endpoint returned no URLs. Raw payload:", uploadResponse?.data);
            throw new Error("Image upload failed: no URL from server");
          }
        } catch (e) {
          const msg = e?.response?.data?.message || e?.message || "Image upload failed";
          throw new Error(msg);
        }

        // hero index must account for existing images length when editing
        const absoluteHero = Number(heroImageIndex);
        const offset = existingImages.length; // 0 for create
        newImagePayload = imageUrls.map((url, idx) => ({
          url,
          is_hero: offset + idx === absoluteHero,
        }));

        // Safety: if user chose a hero among ONLY new images, ensure exactly one is flagged
        if (!newImagePayload.some((i) => i.is_hero) && !editId) {
          // On create, hero must be within new images. Default first as hero to avoid API rejection.
          newImagePayload = newImagePayload.map((i, idx) => ({ ...i, is_hero: idx === 0 }));
        }
      }

      const payload = {
        name: form.name,
        description: form.description,
        shortdescription: form.shortdescription,
        categoryid: form.categoryid,
        branddesigner: form.branddesigner,
        price: Number(form.price),
        discountprice: form.discountprice ? Number(form.discountprice) : null,
        stock: Number(form.stock),
        isactive: !!form.isactive,
        isfeatured: !!form.isfeatured,
        collection_id: form.collection_id || null,
        colors: Array.isArray(form.colors) ? form.colors : [],
      };

      if (!editId) {
        payload.uploadeddate = new Date().toISOString();
        payload.images = newImagePayload; // must exist on create
        const res = await api.post(PRODUCT_CREATE_URL, payload);
        if (res.status === 201) {
          toast.success("Product created successfully!");
          reset();
          setSelectedImages([]);
          setExistingImages([]);
          setHeroImageIndex(null);
          setColorInput("");
          onSaved?.();
        }
      } else {
        // For edit: if no new images provided, keep existing ones and ensure one is hero
        if (!newImagePayload) {
          if (!existingImages.some((img) => img.is_hero)) {
            // If user picked a hero among existing ones, mark it here
            if (heroImageIndex != null && heroImageIndex < existingImages.length) {
              existingImages.forEach((img, idx) => (img.is_hero = idx === heroImageIndex));
            } else {
              throw new Error("Please select a hero image");
            }
          }
          payload.images = existingImages;
        } else {
          payload.images = newImagePayload;
        }

        const res = await api.put(PRODUCT_UPDATE_URL(editId), payload);
        if (res.status >= 200 && res.status < 300) {
          toast.success("Product updated successfully!");
          onSaved?.();
        }
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const customSelectStyles = useMemo(
    () => ({
      control: (p, s) => ({
        ...p,
        minHeight: 44,
        borderRadius: 6,
        backgroundColor: "#FFFFFF",
        border:
          errors.categoryid || errors.collection_id ? "1px solid #EF4444" : "1px solid #E6DCD2",
        boxShadow: s.isFocused ? "0 0 0 2px #D4A5A5" : "none",
        "&:hover": { borderColor: "#D4A5A5" },
      }),
      menu: (p) => ({
        ...p,
        border: "1px solid #D4A5A5",
        borderRadius: 6,
        backgroundColor: "#FFFFFF",
        zIndex: 50,
      }),
      option: (p, s) => ({
        ...p,
        backgroundColor: s.isSelected ? "#D4A5A5" : s.isFocused ? "#F3E8E8" : "#FFFFFF",
        color: s.isSelected ? "#FFFFFF" : "#111827",
        padding: "0.5rem 0.75rem",
      }),
      singleValue: (p) => ({ ...p, color: "#111827" }),
      placeholder: (p) => ({ ...p, color: "#9CA3AF" }),
      dropdownIndicator: (p) => ({
        ...p,
        color: "#D4A5A5",
        "&:hover": { color: "#C39898" },
      }),
    }),
    [errors.categoryid, errors.collection_id]
  );

  const inputBase =
    "rounded-md px-4 py-3 w-full border border-[#E6DCD2] text-[#6B4226] placeholder-[#6B4226]/50 " +
    "focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-[#D4A5A5]";

  const categoryOptions = (categories || []).map((c) => ({
    value: c.categoryid,
    label: c.name,
  }));

  const collectionOptions = (collections || []).map((c) => ({
    value: c.id,
    label: c.title,
  }));

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-lg border border-[#E6DCD2]">
      <h2 className="text-xl font-semibold text-[#6B4226] mb-4">
        {editId ? "Edit Product" : "Add Product"}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Product Name */}
        <div>
          <label className="block text-sm font-medium text-[#6B4226] mb-1">Product Name *</label>
          <input
            type="text"
            placeholder="e.g., Vintage Silk Scarf"
            className={`${inputBase} ${errors.name ? "border-red-500 ring-red-200" : ""}`}
            {...register("name", {
              required: "Product name is required",
              minLength: { value: 2, message: "Name must be at least 2 characters" },
            })}
          />
          {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>}
        </div>

        {/* Brand / Designer */}
        <div>
          <label className="block text-sm font-medium text-[#6B4226] mb-1">Brand / Designer *</label>
          <input
            type="text"
            placeholder="e.g., Shahu Studio"
            className={`${inputBase} ${errors.branddesigner ? "border-red-500 ring-red-200" : ""}`}
            {...register("branddesigner", {
              required: "Brand/Designer is required",
              minLength: { value: 2, message: "Brand/Designer must be at least 2 characters" },
            })}
          />
          {errors.branddesigner && (
            <p className="text-red-600 text-xs mt-1">{errors.branddesigner.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-[#6B4226] mb-1">Description *</label>
          <textarea
            placeholder="Describe the product..."
            rows={4}
            className={`${inputBase} ${errors.description ? "border-red-500 ring-red-200" : ""}`}
            {...register("description", { required: "Description is required" })}
          />
          {errors.description && <p className="text-red-600 text-xs mt-1">{errors.description.message}</p>}
        </div>

        {/* Short Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-[#6B4226] mb-1">Short Description *</label>
          <input
            type="text"
            placeholder="Short teaser shown in listings"
            className={`${inputBase} ${errors.shortdescription ? "border-red-500 ring-red-200" : ""}`}
            {...register("shortdescription", { required: "Short description is required" })}
          />
          {errors.shortdescription && (
            <p className="text-red-600 text-xs mt-1">{errors.shortdescription.message}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-[#6B4226] mb-1">Category *</label>
          <Select
            options={categoryOptions}
            value={categoryOptions.find((o) => o.value === categoryid) || null}
            onChange={(opt) => {
              setValue("categoryid", opt ? opt.value : "");
              trigger("categoryid");
            }}
            placeholder={loadingCats ? "Loading…" : "Select Category"}
            isLoading={loadingCats}
            isClearable
            styles={customSelectStyles}
            classNamePrefix="react-select"
          />
          {errors.categoryid && <p className="text-red-600 text-xs mt-1">{errors.categoryid.message}</p>}
        </div>

        {/* Collection */}
        <div>
          <label className="block text-sm font-medium text-[#6B4226] mb-1">Collection</label>
          <Select
            options={collectionOptions}
            value={collectionOptions.find((o) => o.value === collection_id) || null}
            onChange={(opt) => {
              setValue("collection_id", opt ? opt.value : null);
              trigger("collection_id");
            }}
            placeholder={loadingCollections ? "Loading…" : "Select Collection"}
            isLoading={loadingCollections}
            isClearable
            styles={customSelectStyles}
            classNamePrefix="react-select"
          />
          {errors.collection_id && (
            <p className="text-red-600 text-xs mt-1">{errors.collection_id.message}</p>
          )}
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-[#6B4226] mb-1">Price (₹) *</label>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            className={`${inputBase} ${errors.price ? "border-red-500 ring-red-200" : ""}`}
            {...register("price", {
              required: "Price is required",
              min: { value: 0, message: "Price must be positive" },
            })}
            onBlur={() => trigger("discountprice")}
          />
          {errors.price && <p className="text-red-600 text-xs mt-1">{errors.price.message}</p>}
        </div>

        {/* Discount Price */}
        <div>
          <label className="block text-sm font-medium text-[#6B4226] mb-1">Discount Price (₹)</label>
          <input
            type="number"
            step="0.01"
            placeholder="Optional"
            className={`${inputBase} ${errors.discountprice ? "border-red-500 ring-red-200" : ""}`}
            {...register("discountprice", {
              min: { value: 0, message: "Discount price must be positive" },
              validate: (v) => v === "" || Number(v) <= Number(price || 0) || "Discount cannot exceed price",
            })}
          />
          {errors.discountprice && (
            <p className="text-red-600 text-xs mt-1">{errors.discountprice.message}</p>
          )}
        </div>

        {/* Stock */}
        <div>
          <label className="block text-sm font-medium text-[#6B4226] mb-1">Stock *</label>
          <input
            type="number"
            placeholder="0"
            className={`${inputBase} ${errors.stock ? "border-red-500 ring-red-200" : ""}`}
            {...register("stock", {
              required: "Stock is required",
              min: { value: 0, message: "Stock must be positive" },
            })}
          />
          {errors.stock && <p className="text-red-600 text-xs mt-1">{errors.stock.message}</p>}
        </div>

        {/* Colors (tag box) */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-[#6B4226] mb-1">Colors</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={colorInput}
              onChange={(e) => setColorInput(e.target.value)}
              placeholder="#173F5F or navy"
              className={inputBase}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addColor();
                }
              }}
            />
            <button
              type="button"
              onClick={addColor}
              className="px-4 py-2 rounded-md bg-[#D4A5A5] text-white font-semibold hover:opacity-90"
            >
              Add
            </button>
          </div>

          {colors.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {colors.map((c, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E6DCD2] bg-white"
                  title={c}
                >
                  <span
                    className="inline-block w-4 h-4 rounded-full border border-[#E6DCD2]"
                    style={{ backgroundColor: c }}
                  />
                  <span className="text-sm text-[#6B4226]">{c}</span>
                  <button
                    type="button"
                    onClick={() => removeColor(idx)}
                    className="ml-1 text-xs text-[#6B4226]/70 hover:text-[#6B4226]"
                    aria-label={`Remove ${c}`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-2">
          <input id="isactive" type="checkbox" className="h-4 w-4" {...register("isactive")} />
          <label htmlFor="isactive" className="text-sm text-[#6B4226]">Active</label>
        </div>
        <div className="flex items-center gap-2">
          <input id="isfeatured" type="checkbox" className="h-4 w-4" {...register("isfeatured")} />
          <label htmlFor="isfeatured" className="text-sm text-[#6B4226]">Featured</label>
        </div>

        {/* Images */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-[#6B4226] mb-1">
            Images {editId ? "(optional)" : "*"}
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            className={`w-full ${
              errors.images ? "border-red-500 ring-red-200" : ""
            } file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-white file:font-semibold file:bg-[#D4A5A5] file:hover:bg-[#C39898] file:transition`}
            {...register("images", {
              required: editId ? false : "At least one image is required",
              validate: {
                fileType: (files) =>
                  Array.from(files || []).every((f) => f.type?.startsWith("image/")) ||
                  "Please select image files only",
                ...(editId
                  ? {}
                  : {
                      minCount: (files) =>
                        (files?.length || 0) >= 1 || "At least one image is required",
                    }),
              },
            })}
            onChange={handleImageChange}
          />
          {errors.images && <p className="text-red-600 text-xs mt-1">{errors.images.message}</p>}
        </div>

        {/* Previews + Hero picker */}
        {(existingImages.length > 0 || previews.length > 0) && (
          <div className="md:col-span-2">
            <p className="text-sm font-semibold mb-2 text-[#6B4226]">Select Hero Image:</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {existingImages.map((img, idx) => (
                <button
                  type="button"
                  key={`old-${idx}`}
                  className={`relative group rounded-md overflow-hidden border ${
                    heroImageIndex === idx ? "border-[#D4A5A5] ring-2 ring-[#D4A5A5]" : "border-[#E6DCD2]"
                  }`}
                  onClick={() => setHeroImageIndex(idx)}
                >
                  <img src={img.url} alt={`Existing ${idx + 1}`} className="w-full h-24 object-cover" />
                  <span
                    className={`absolute bottom-1 left-1 right-1 text-[11px] px-1.5 py-0.5 rounded ${
                      heroImageIndex === idx ? "bg-[#D4A5A5] text-white" : "bg-white/80 text-[#6B4226]"
                    }`}
                  >
                    {heroImageIndex === idx ? "Hero Image" : "Tap to set as Hero"}
                  </span>
                </button>
              ))}
              {previews.map((src, index) => {
                const absoluteIndex = existingImages.length + index;
                return (
                  <button
                    type="button"
                    key={`new-${index}`}
                    className={`relative group rounded-md overflow-hidden border ${
                      heroImageIndex === absoluteIndex
                        ? "border-[#D4A5A5] ring-2 ring-[#D4A5A5]"
                        : "border-[#E6DCD2]"
                    }`}
                    onClick={() => setHeroImageIndex(absoluteIndex)}
                    aria-pressed={heroImageIndex === absoluteIndex}
                  >
                    <img src={src} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover" />
                    <span
                      className={`absolute bottom-1 left-1 right-1 text-[11px] px-1.5 py-0.5 rounded ${
                        heroImageIndex === absoluteIndex ? "bg-[#D4A5A5] text-white" : "bg-white/80 text-[#6B4226]"
                      }`}
                    >
                      {heroImageIndex === absoluteIndex ? "Hero Image" : "Tap to set as Hero"}
                    </span>
                  </button>
                );
              })}
            </div>
            {!editId && heroImageIndex === null && (
              <p className="text-red-600 text-xs mt-2">Please select a hero image</p>
            )}
          </div>
        )}

        {/* Submit */}
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isSubmitting || (!editId && heroImageIndex === null)}
            className="w-full bg-[#D4A5A5] hover:opacity-90 text-white px-6 py-3 rounded-md transition font-semibold shadow disabled:opacity-50"
          >
            {isSubmitting ? (editId ? "Updating…" : "Adding Product…") : editId ? "Update Product" : "Add Product"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
