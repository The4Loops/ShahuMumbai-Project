import { useEffect, useMemo, useState } from 'react';
import api from '../supabase/axios';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router-dom';
import Select from 'react-select';

const slugify = (s) =>
  s
    ?.toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const AddCollections = ({ editId = null, onSaved }) => {
  // If editId is passed via AdminPanel, use it; otherwise fall back to route param
  const params = useParams();
  const routedId = params?.id || null;
  const effectiveId = editId ?? routedId;
  const isEdit = !!effectiveId;

  // Only use navigate when we’re actually on a routed page
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    trigger,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      status: 'DRAFT',
      is_active: true,
      cover_image: null,
      categoryids: [],
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingCover, setExistingCover] = useState(null);
  const [preview, setPreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoriesError, setCategoriesError] = useState(null);

  // Auto-slug from title (only when creating)
  const title = watch('title');
  useEffect(() => {
    if (!isEdit) setValue('slug', slugify(title || ''));
  }, [title, isEdit, setValue]);

  // Preview cover image (live for new file or from existing)
  const coverFile = watch('cover_image');
  useEffect(() => {
    if (!coverFile || !coverFile[0]) {
      setPreview(existingCover); // keep showing existing cover when editing
      return;
    }
    const url = URL.createObjectURL(coverFile[0]);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile, existingCover]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/api/category');
        const categoriesData = Array.isArray(data) ? data : data?.categories || [];
        setCategories(categoriesData);
      } catch (err) {
        const msg = err?.response?.data?.message || 'Failed to fetch categories';
        setCategoriesError(msg);
        toast.error(msg);
      }
    };
    fetchCategories();
  }, []);

  // Load collection for edit
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const { data } = await api.get(`/api/collections/${effectiveId}`);
        reset({
          title: data.title || '',
          slug: data.slug || '',
          description: data.description || '',
          status: data.status || 'DRAFT',
          is_active: !!data.is_active,
          cover_image: null, // keep file input empty
          categoryids: Array.isArray(data.categoryids) ? data.categoryids : [],
        });
        setExistingCover(data.cover_image || null);
        setPreview(data.cover_image || null);
      } catch (e) {
        toast.error('Failed to load collection');
      }
    })();
  }, [isEdit, effectiveId, reset]);

  const onSubmit = async (form) => {
    setIsSubmitting(true);
    toast.dismiss();
    try {
      let cover_url = existingCover || null;

      // Upload new cover if chosen
      if (form.cover_image && form.cover_image[0]) {
        const file = form.cover_image[0];
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
          toast.error('Please upload a valid image (JPEG, PNG, or WebP)');
          setIsSubmitting(false);
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error('Image size must be less than 5MB');
          setIsSubmitting(false);
          return;
        }

        const fd = new FormData();
        fd.append('image', file);
        const { data } = await api.post('/api/upload/single', fd, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        cover_url = data.url;
      }

      const payload = {
        title: form.title.trim(),
        slug: (form.slug || slugify(form.title)).trim(),
        description: form.description || null,
        cover_image: cover_url,
        status: form.status,
        is_active: !!form.is_active,
        categoryids: form.categoryids || [],
      };

      if (isEdit) {
        await api.put(`/api/collections/${effectiveId}`, payload);
        toast.success('Collection updated!');
        // Inline AdminPanel flow: call onSaved and stay
        if (typeof onSaved === 'function') onSaved();
        // Routed page flow: navigate back to listing
        if (!editId && routedId) navigate('/collections');
      } else {
        await api.post('/api/collections', payload);
        toast.success('Collection created!');
        // Reset only on create
        reset({
          title: '',
          slug: '',
          description: '',
          status: 'DRAFT',
          is_active: true,
          cover_image: null,
          categoryids: [],
        });
        setExistingCover(null);
        setPreview(null);
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || err.message || 'Failed to save collection');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputBase =
    'rounded-md px-4 py-3 w-full border border-[#E6DCD2] text-[#6B4226] placeholder-[#6B4226]/50 ' +
    'focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-[#D4A5A5]';

  const customSelectStyles = useMemo(
    () => ({
      control: (p, s) => ({
        ...p,
        minHeight: 44,
        borderRadius: 6,
        backgroundColor: '#FFFFFF',
        border: errors.categoryids ? '1px solid #EF4444' : '1px solid #E6DCD2',
        boxShadow: s.isFocused ? '0 0 0 2px #D4A5A5' : 'none',
        '&:hover': { borderColor: '#D4A5A5' },
      }),
      menu: (p) => ({
        ...p,
        border: '1px solid #D4A5A5',
        borderRadius: 6,
        backgroundColor: '#FFFFFF',
        zIndex: 50,
      }),
      option: (p, s) => ({
        ...p,
        backgroundColor: s.isSelected ? '#D4A5A5' : s.isFocused ? '#F3E8E8' : '#FFFFFF',
        color: s.isSelected ? '#FFFFFF' : '#111827',
        padding: '0.5rem 0.75rem',
      }),
      singleValue: (p) => ({ ...p, color: '#111827' }),
      placeholder: (p) => ({ ...p, color: '#9CA3AF' }),
      dropdownIndicator: (p) => ({
        ...p,
        color: '#D4A5A5',
        '&:hover': { color: '#C39898' },
      }),
    }),
    [errors.categoryids]
  );

  const categoryOptions = categories.map((c) => ({
    value: c.categoryid,
    label: c.name,
  }));

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 bg-white rounded-lg border border-[#E6DCD2]">
      <h2 className="text-xl font-semibold text-[#6B4226] mb-4">
        {isEdit ? 'Edit Collection' : 'Add Collection'}
      </h2>

      {categoriesError && (
        <div className="mb-4 text-sm text-red-600">{categoriesError}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#6B4226] mb-1">Title *</label>
          <input
            type="text"
            className={`${inputBase} ${errors.title ? 'border-red-500 ring-red-200' : ''}`}
            {...register('title', { required: 'Title is required' })}
          />
          {errors.title && <p className="text-red-600 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#6B4226] mb-1">Slug *</label>
          <input
            type="text"
            className={`${inputBase} ${errors.slug ? 'border-red-500 ring-red-200' : ''}`}
            {...register('slug', { required: 'Slug is required' })}
          />
          {errors.slug && <p className="text-red-600 text-xs mt-1">{errors.slug.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#6B4226] mb-1">Categories *</label>
          <Controller
            name="categoryids"
            control={control}
            rules={{ required: 'At least one category is required' }}
            render={({ field }) => (
              <Select
                isMulti
                options={categoryOptions}
                value={categoryOptions.filter((o) => field.value?.includes(o.value))}
                onChange={(opts) => {
                  field.onChange(opts ? opts.map((o) => o.value) : []);
                  trigger('categoryids');
                }}
                placeholder={categories.length ? 'Select Categories' : 'Loading...'}
                isLoading={!categories.length}
                isClearable
                styles={customSelectStyles}
                classNamePrefix="react-select"
              />
            )}
          />
          {errors.categoryids && (
            <p className="text-red-600 text-xs mt-1">{errors.categoryids.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#6B4226] mb-1">Status *</label>
          <select
            className={inputBase}
            {...register('status', { required: true })}
          >
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input id="is_active" type="checkbox" className="h-4 w-4" {...register('is_active')} />
          <label htmlFor="is_active" className="text-sm text-[#6B4226]">Active</label>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#6B4226] mb-1">Description</label>
          <textarea rows={4} className={inputBase} {...register('description')} />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#6B4226] mb-1">Cover Image</label>
          <input type="file" accept="image/jpeg,image/png,image/webp" {...register('cover_image')} />
          {(preview || existingCover) && (
            <div className="mt-3">
              <img
                src={preview || existingCover}
                alt="Cover preview"
                className="w-full max-w-sm h-40 object-cover rounded-md border"
              />
              {isEdit && existingCover && (
                <button
                  type="button"
                  onClick={() => {
                    setExistingCover(null);
                    setPreview(null);
                    setValue('cover_image', null);
                  }}
                  className="mt-2 text-sm text-red-600 hover:underline"
                >
                  Remove Cover Image
                </button>
              )}
            </div>
          )}
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#D4A5A5] hover:opacity-90 text-white px-6 py-3 rounded-md transition font-semibold shadow disabled:opacity-50"
          >
            {isSubmitting ? (isEdit ? 'Updating…' : 'Creating…') : (isEdit ? 'Update Collection' : 'Create Collection')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCollections;
