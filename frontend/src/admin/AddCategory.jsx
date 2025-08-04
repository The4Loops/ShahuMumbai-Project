import { useState } from 'react';
import api from '../supabase/axios';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

const AddCategory = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    toast.dismiss(); // Clear any existing toasts

    try {
      const response = await api.post('/api/category', data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (response.status === 201) {
        toast.success('Category created successfully!');
        reset();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <div>
          <input
            type="text"
            placeholder="Category Name"
            className={`rounded-md px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-[#D4A5A5] ${errors.name ? 'border-red-500' : ''}`}
            {...register('name', {
              required: 'Category name is required',
              minLength: { value: 2, message: 'Category name must be at least 2 characters' },
            })}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#D4A5A5] hover:bg-[#C39898] text-white px-6 py-3 rounded-md transition font-semibold shadow disabled:opacity-50"
        >
          {isSubmitting ? 'Adding Category...' : 'Add Category'}
        </button>
      </form>
    </div>
  );
};

export default AddCategory;