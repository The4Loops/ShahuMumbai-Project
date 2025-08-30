// src/pages/AddCollections.jsx
import { useEffect, useMemo, useState } from 'react';
import api from '../supabase/axios';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router-dom';

const slugify = (s) =>
  s
    ?.toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const AddCollections = () => {
  const { id } = useParams(); // edit if present
  const isEdit = !!id;
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      status: 'DRAFT',
      is_active: true,
      cover_image: null,
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingCover, setExistingCover] = useState(null);
  const [preview, setPreview] = useState(null);

  // Auto-slug from title
  const title = watch('title');
  useEffect(() => {
    if (!isEdit) setValue('slug', slugify(title || ''));
  }, [title, isEdit, setValue]);

  // Preview cover
  const coverFile = watch('cover_image');
  useEffect(() => {
    if (!coverFile || !coverFile[0]) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(coverFile[0]);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  // Load for edit
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const { data } = await api.get(`/api/admin/collections/${id}`);
        reset({
          title: data.title,
          slug: data.slug,
          description: data.description || '',
          status: data.status || 'DRAFT',
          is_active: data.is_active,
        });
        setExistingCover(data.cover_image || null);
      } catch {
        toast.error('Failed to load collection');
      }
    })();
  }, [isEdit, id, reset]);

  const onSubmit = async (form) => {
    setIsSubmitting(true);
    toast.dismiss();
    try {
      let cover_url = existingCover || null;

      // If a new file was chosen, upload it
      if (form.cover_image && form.cover_image[0]) {
        const fd = new FormData();
        fd.append('files', form.cover_image[0]);
        const up = await api.post('/api/upload/multiple', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const urls = up?.data?.imageUrls || [];
        if (!urls.length) throw new Error('Cover image upload failed');
        cover_url = urls[0];
      }

      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim() || slugify(form.title),
        description: form.description || null,
        cover_image: cover_url,
        status: form.status,
        is_active: !!form.is_active,
      };

      if (isEdit) {
        await api.put(`/api/admin/collections/${id}`, payload);
        toast.success('Collection updated!');
      } else {
        await api.post('/api/admin/collections', payload);
        toast.success('Collection created!');
        reset({
          title: '',
          slug: '',
          description: '',
          status: 'DRAFT',
          is_active: true,
          cover_image: null,
        });
        setExistingCover(null);
        setPreview(null);
      }

      // navigate('/admin/collections'); // optional
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to save collection');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputBase =
    'rounded-md px-4 py-3 w-full border border-[#E6DCD2] text-[#6B4226] placeholder-[#6B4226]/50 ' +
    'focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-[#D4A5A5]';

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 bg-white rounded-lg border border-[#E6DCD2]">
      <h2 className="text-xl font-semibold text-[#6B4226] mb-4">
        {isEdit ? 'Edit Collection' : 'Add Collection'}
      </h2>

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
          <input type="file" accept="image/*" {...register('cover_image')} />
          {(preview || existingCover) && (
            <div className="mt-3">
              <img
                src={preview || existingCover}
                alt="Cover preview"
                className="w-full max-w-sm h-40 object-cover rounded-md border"
              />
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
