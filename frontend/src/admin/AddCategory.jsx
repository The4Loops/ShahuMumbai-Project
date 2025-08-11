import { useEffect, useState } from 'react';
import api from '../supabase/axios';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');

const AddCategory = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm({
    defaultValues: { name: '', slug: '' },
  });

  const [slugTouched, setSlugTouched] = useState(false);
  const nameValue = watch('name');
  const slugValue = watch('slug');

  // Auto-generate slug from name until user edits slug manually
  useEffect(() => {
    if (!slugTouched) setValue('slug', slugify(nameValue || ''));
  }, [nameValue, slugTouched, setValue]);

  const onSubmit = async (data) => {
    toast.dismiss();
    try {
      // If your backend ONLY expects { name }, remove slug here:
      // const payload = { name: data.name };
      const payload = { name: data.name, slug: data.slug || slugify(data.name) };

      const response = await api.post('/api/category', payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (response.status === 201) {
        toast.success('Category created successfully!');
        reset({ name: '', slug: '' });
        setSlugTouched(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create category');
    }
  };

  const inputBase =
    'w-full rounded-md px-4 py-3 border border-[#E6DCD2] text-[#6B4226] placeholder-[#6B4226]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-[#D4A5A5]';

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white rounded-lg border border-[#E6DCD2]">
      <h2 className="text-xl font-semibold text-[#6B4226] mb-4">Add Category</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        {/* Category Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[#6B4226] mb-1">
            Category Name *
          </label>
          <input
            id="name"
            type="text"
            placeholder="e.g., Sarees"
            className={`${inputBase} ${errors.name ? 'border-red-500 ring-red-200' : ''}`}
            aria-invalid={!!errors.name}
            {...register('name', {
              required: 'Category name is required',
              minLength: { value: 2, message: 'Category name must be at least 2 characters' },
            })}
          />
          {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>}
        </div>

        {/* Slug (optional, auto-generated) */}
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="slug" className="block text-sm font-medium text-[#6B4226] mb-1">
              Slug (optional)
            </label>
            <span className="text-xs text-[#6B4226]/60 break-all">
              Preview: <i>/category/{slugValue || slugify(nameValue || 'your-category')}</i>
            </span>
          </div>
          <input
            id="slug"
            type="text"
            placeholder="auto-generated-from-name"
            className={inputBase}
            onChange={(e) => {
              setSlugTouched(true);
              // always keep it URL-safe
              setValue('slug', slugify(e.target.value));
            }}
            {...register('slug')}
          />
          <p className="text-xs text-[#6B4226]/60 mt-1">Leave blank to auto-generate.</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end pt-2">
          <button
            type="button"
            onClick={() => {
              reset({ name: '', slug: '' });
              setSlugTouched(false);
              toast.dismiss();
            }}
            className="px-4 py-2 rounded-md border border-[#D4A5A5] text-[#6B4226] hover:bg-[#F3DEDE]"
          >
            Reset
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#D4A5A5] hover:opacity-90 disabled:opacity-60 text-white px-6 py-3 rounded-md transition font-semibold shadow"
          >
            {isSubmitting ? 'Adding Category…' : 'Add Category'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCategory;
