import { useEffect, useMemo, useState } from 'react';
import api from '../supabase/axios';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import Select from 'react-select';

const AddProduct = () => {
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
      categoryid: '', 
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [heroImageIndex, setHeroImageIndex] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [previews, setPreviews] = useState([]); // object URLs to clean up
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCats(true);
        const response = await api.get('/api/category');
        setCategories(response.data || []);
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to fetch categories');
      } finally {
        setLoadingCats(false);
      }
    };
    fetchCategories();
  }, []);

  // Generate & cleanup image previews
  useEffect(() => {
    // revoke old
    previews.forEach((url) => URL.revokeObjectURL(url));
    // create new
    const urls = selectedImages.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImages]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages(files);
    setHeroImageIndex(null); // Reset hero image selection
  };

  const price = watch('price');
  const discountprice = watch('discountprice');
  const categoryid = watch('categoryid'); 

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    toast.dismiss();

    try {
      // Validate hero image selection
      if (selectedImages.length === 0) throw new Error('At least one image is required');
      if (heroImageIndex === null) throw new Error('Please select a hero image');

      // Validate categoryid
      if (!data.categoryid) throw new Error('Category is required');

      // Upload images (multipart)
      const formData = new FormData();
      selectedImages.forEach((file) => formData.append('files', file));

      const uploadResponse = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const imageUrls = uploadResponse?.data?.imageUrls || [];
      if (!imageUrls.length) throw new Error('Image upload failed');

      // Prepare product payload
      const productData = {
        name: data.name,
        description: data.description,
        shortdescription: data.shortdescription,
        categoryid: data.categoryid,
        branddesigner: data.branddesigner,
        price: Number(data.price),
        discountprice: data.discountprice ? Number(data.discountprice) : null,
        stock: Number(data.stock),
        isactive: !!data.isactive,
        isfeatured: !!data.isfeatured,
        uploadeddate: new Date().toISOString(),
        images: imageUrls.map((url, index) => ({
          url,
          is_hero: index === Number(heroImageIndex),
        })),
      };

      const response = await api.post('/api/products', productData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (response.status === 201) {
        toast.success('Product created successfully!');
        reset();
        setSelectedImages([]);
        setHeroImageIndex(null);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Themed react-select styles
  const customSelectStyles = useMemo(
    () => ({
      control: (provided, state) => ({
        ...provided,
        minHeight: 44,
        borderRadius: 6,
        backgroundColor: '#FFFFFF',
        border: errors.categoryid ? '1px solid #EF4444' : '1px solid #E6DCD2',
        boxShadow: state.isFocused ? '0 0 0 2px #D4A5A5' : 'none',
        '&:hover': { borderColor: '#D4A5A5' },
      }),
      menu: (provided) => ({
        ...provided,
        border: '1px solid #D4A5A5',
        borderRadius: 6,
        backgroundColor: '#FFFFFF',
        zIndex: 50,
      }),
      option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected ? '#D4A5A5' : state.isFocused ? '#F3E8E8' : '#FFFFFF',
        color: state.isSelected ? '#FFFFFF' : '#111827',
        padding: '0.5rem 0.75rem',
      }),
      singleValue: (provided) => ({ ...provided, color: '#111827' }),
      placeholder: (provided) => ({ ...provided, color: '#9CA3AF' }),
      dropdownIndicator: (provided) => ({
        ...provided,
        color: '#D4A5A5',
        '&:hover': { color: '#C39898' },
      }),
    }),
    [errors.categoryid]
  );

  const inputBase =
    'rounded-md px-4 py-3 w-full border border-[#E6DCD2] text-[#6B4226] placeholder-[#6B4226]/50 ' +
    'focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-[#D4A5A5]';

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-lg border border-[#E6DCD2]">
      <h2 className="text-xl font-semibold text-[#6B4226] mb-4">Add Product</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Product Name */}
        <div>
          <label className="block text-sm font-medium text-[#6B4226] mb-1">Product Name *</label>
          <input
            type="text"
            placeholder="e.g., Vintage Silk Scarf"
            className={`${inputBase} ${errors.name ? 'border-red-500 ring-red-200' : ''}`}
            {...register('name', {
              required: 'Product name is required',
              minLength: { value: 2, message: 'Name must be at least 2 characters' },
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
            className={`${inputBase} ${errors.branddesigner ? 'border-red-500 ring-red-200' : ''}`}
            {...register('branddesigner', {
              required: 'Brand/Designer is required',
              minLength: { value: 2, message: 'Brand/Designer must be at least 2 characters' },
            })}
          />
          {errors.branddesigner && <p className="text-red-600 text-xs mt-1">{errors.branddesigner.message}</p>}
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-[#6B4226] mb-1">Description *</label>
          <textarea
            placeholder="Describe the product..."
            rows={4}
            className={`${inputBase} ${errors.description ? 'border-red-500 ring-red-200' : ''}`}
            {...register('description', { required: 'Description is required' })}
          />
          {errors.description && <p className="text-red-600 text-xs mt-1">{errors.description.message}</p>}
        </div>

        {/* Short Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-[#6B4226] mb-1">Short Description *</label>
          <input
            type="text"
            placeholder="Short teaser shown in listings"
            className={`${inputBase} ${errors.shortdescription ? 'border-red-500 ring-red-200' : ''}`}
            {...register('shortdescription', { required: 'Short description is required' })}
          />
          {errors.shortdescription && <p className="text-red-600 text-xs mt-1">{errors.shortdescription.message}</p>}
        </div>

        {/* Category (react-select) */}
        <div>
          <label className="block text-sm font-medium text-[#6B4226] mb-1">Category *</label>
          <Select
            options={(categories || []).map((c) => ({ value: c.categoryid, label: c.name }))}
            onChange={(opt) => {
              setValue('categoryid', opt ? opt.value : '');
              trigger('categoryid');
            }}
            placeholder={loadingCats ? 'Loading…' : 'Select Category'}
            isLoading={loadingCats}
            isClearable
            styles={customSelectStyles}
            classNamePrefix="react-select"
          />
          {errors.categoryid && <p className="text-red-600 text-xs mt-1">{errors.categoryid.message}</p>}
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-[#6B4226] mb-1">Price (₹) *</label>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            className={`${inputBase} ${errors.price ? 'border-red-500 ring-red-200' : ''}`}
            {...register('price', {
              required: 'Price is required',
              min: { value: 0, message: 'Price must be positive' },
            })}
            onBlur={() => trigger('discountprice')}
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
            className={`${inputBase} ${errors.discountprice ? 'border-red-500 ring-red-200' : ''}`}
            {...register('discountprice', {
              min: { value: 0, message: 'Discount price must be positive' },
              validate: (v) =>
                v === '' ||
                Number(v) <= Number(price || 0) ||
                'Discount cannot exceed price',
            })}
          />
          {errors.discountprice && <p className="text-red-600 text-xs mt-1">{errors.discountprice.message}</p>}
        </div>

        {/* Stock */}
        <div>
          <label className="block text-sm font-medium text-[#6B4226] mb-1">Stock *</label>
          <input
            type="number"
            placeholder="0"
            className={`${inputBase} ${errors.stock ? 'border-red-500 ring-red-200' : ''}`}
            {...register('stock', {
              required: 'Stock is required',
              min: { value: 0, message: 'Stock must be positive' },
            })}
          />
          {errors.stock && <p className="text-red-600 text-xs mt-1">{errors.stock.message}</p>}
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-2">
          <input id="isactive" type="checkbox" className="h-4 w-4" {...register('isactive')} />
          <label htmlFor="isactive" className="text-sm text-[#6B4226]">Active</label>
        </div>
        <div className="flex items-center gap-2">
          <input id="isfeatured" type="checkbox" className="h-4 w-4" {...register('isfeatured')} />
          <label htmlFor="isfeatured" className="text-sm text-[#6B4226]">Featured</label>
        </div>

        {/* Images */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-[#6B4226] mb-1">Images *</label>
          <input
            type="file"
            accept="image/*"
            multiple
            className={`w-full ${errors.images ? 'border-red-500 ring-red-200' : ''} 
                        file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-white 
                        file:font-semibold file:bg-[#D4A5A5] file:hover:bg-[#C39898] file:transition`}
            {...register('images', {
              required: 'At least one image is required',
              validate: {
                fileType: (files) =>
                  Array.from(files || []).every((f) => f.type.startsWith('image/')) ||
                  'Please select image files only',
                minCount: (files) => (files?.length || 0) >= 1 || 'At least one image is required',
              },
            })}
            onChange={handleImageChange}
          />
          {errors.images && <p className="text-red-600 text-xs mt-1">{errors.images.message}</p>}
        </div>

        {/* Hero Image Picker */}
        {selectedImages.length > 0 && (
          <div className="md:col-span-2">
            <p className="text-sm font-semibold mb-2 text-[#6B4226]">Select Hero Image:</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {previews.map((src, index) => (
                <button
                  type="button"
                  key={index}
                  className={`relative group rounded-md overflow-hidden border ${
                    heroImageIndex === index ? 'border-[#D4A5A5] ring-2 ring-[#D4A5A5]' : 'border-[#E6DCD2]'
                  }`}
                  onClick={() => setHeroImageIndex(index)}
                  aria-pressed={heroImageIndex === index}
                >
                  <img src={src} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover" />
                  <span
                    className={`absolute bottom-1 left-1 right-1 text-[11px] px-1.5 py-0.5 rounded 
                      ${heroImageIndex === index ? 'bg-[#D4A5A5] text-white' : 'bg-white/80 text-[#6B4226]'}`}
                  >
                    {heroImageIndex === index ? 'Hero Image' : 'Tap to set as Hero'}
                  </span>
                </button>
              ))}
            </div>
            {heroImageIndex === null && (
              <p className="text-red-600 text-xs mt-2">Please select a hero image</p>
            )}
          </div>
        )}

        {/* Submit */}
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isSubmitting || heroImageIndex === null}
            className="w-full bg-[#D4A5A5] hover:opacity-90 text-white px-6 py-3 rounded-md transition font-semibold shadow disabled:opacity-50"
          >
            {isSubmitting ? 'Adding Product...' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
