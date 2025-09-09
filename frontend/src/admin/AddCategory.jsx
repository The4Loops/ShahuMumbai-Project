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

const AddCategory = ({ editId = null, onSaved }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm({
    defaultValues: { name: '', slug: '', image: null },
  });

  const [slugTouched, setSlugTouched] = useState(false);
  const [existingImage, setExistingImage] = useState(''); // stores current image when editing

  const nameValue = watch('name');
  const slugValue = watch('slug');

  // Auto-generate slug from name until user edits slug manually
  useEffect(() => {
    if (!slugTouched) setValue('slug', slugify(nameValue || ''));
  }, [nameValue, slugTouched, setValue]);

  // If editing: fetch category by id and prefill
  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const { data } = await api.get(`/api/category/${editId}`);
        // Expect: { categoryid, name, slug, image }
        reset({ name: data?.name || '', slug: data?.slug || '', image: null });
        setExistingImage(data?.image || '');
        setSlugTouched(true); // prevent auto-overwriting slug after we set it
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to load category');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const onSubmit = async (form) => {
    toast.dismiss();
    try {
      let imageUrl = existingImage || '';

      // Handle image upload if a file is selected
      if (form.image && form.image[0]) {
        const formData = new FormData();
        formData.append('image', form.image[0]);

        const uploadResponse = await api.post('/api/upload/single', formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
          },
        });

        if (uploadResponse.status === 200 || uploadResponse.status === 201) {
          imageUrl = uploadResponse.data.url; // backend returns { url }
        } else {
          throw new Error('Image upload failed');
        }
      }

      const payload = {
        name: form.name,
        slug: form.slug || slugify(form.name),
        image: imageUrl || undefined, // omit if empty
      };

      if (!editId) {
        // CREATE
        const resp = await api.post('/api/category', payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (resp.status === 201) {
          toast.success('Category created successfully!');
          reset({ name: '', slug: '', image: null });
          setSlugTouched(false);
          setExistingImage('');
          onSaved?.();
        }
      } else {
        // UPDATE
        const resp = await api.put(`/api/category/${editId}`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (resp.status >= 200 && resp.status < 300) {
          toast.success('Category updated successfully!');
          onSaved?.();
        }
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || (editId ? 'Failed to update category' : 'Failed to create category'));
    }
  };

  const inputBase =
    'w-full rounded-md px-4 py-3 border border-[#E6DCD2] text-[#6B4226] placeholder-[#6B4226]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-[#D4A5A5]';

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white rounded-lg border border-[#E6DCD2]">
      <h2 className="text-xl font-semibold text-[#6B4226] mb-4">
        {editId ? 'Edit Category' : 'Add Category'}
      </h2>

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
              setValue('slug', slugify(e.target.value));
            }}
            {...register('slug')}
          />
          <p className="text-xs text-[#6B4226]/60 mt-1">Leave blank to auto-generate.</p>
        </div>

        {/* Image Upload + Current Preview (when editing) */}
        <div>
          <label htmlFor="image" className="block text-sm font-medium text-[#6B4226] mb-1">
            {editId ? 'Replace Image (optional)' : 'Category Image (optional)'}
          </label>
          <input
            id="image"
            type="file"
            accept="image/*"
            className={`${inputBase} ${errors.image ? 'border-red-500 ring-red-200' : ''}`}
            {...register('image')}
          />
          {existingImage && (
            <div className="mt-2 flex items-center gap-3">
              <div className="w-16 h-16 rounded overflow-hidden border border-[#E6DCD2] bg-gray-50">
                <img src={existingImage} alt="Current" className="w-full h-full object-cover" />
              </div>
              <a
                href={existingImage}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                View current image
              </a>
            </div>
          )}
          <p className="text-xs text-[#6B4226]/60 mt-1">
            {editId ? 'Leave blank to keep current image.' : 'Upload an image for the category.'}
          </p>
          {errors.image && <p className="text-red-600 text-xs mt-1">{errors.image.message}</p>}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end pt-2">
          <button
            type="button"
            onClick={() => {
              reset({ name: '', slug: '', image: null });
              setSlugTouched(false);
              setExistingImage('');
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
            {isSubmitting
              ? editId
                ? 'Updating…'
                : 'Adding Category…'
              : editId
              ? 'Update Category'
              : 'Add Category'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCategory;
