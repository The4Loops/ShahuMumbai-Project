import { useState, useEffect } from 'react';
import api from '../supabase/axios';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import Select from 'react-select';

const AddProduct = () => {
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [heroImageIndex, setHeroImageIndex] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [categories, setCategories] = useState([]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/api/category');
        setCategories(response.data);
      } catch (err) {
        toast.error(err || 'Failed to fetch categories');
      }
    };
    fetchCategories();
  }, []);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(files);
    setHeroImageIndex(null); // Reset hero image selection
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    toast.dismiss(); // Clear any existing toasts

    try {
      // Validate hero image selection
      if (selectedImages.length === 0) {
        throw new Error('At least one image is required');
      }
      if (heroImageIndex === null) {
        throw new Error('Please select a hero image');
      }

      // Upload images to Cloudinary
      const formData = new FormData();
      selectedImages.forEach((file, index) => {
        formData.append('files', file);
      });

      const uploadResponse = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const imageUrls = uploadResponse.data.imageUrls;

      // Prepare product data
      const productData = {
        name: data.name,
        description: data.description,
        shortdescription: data.shortdescription,
        categoryid: data.categoryid,
        branddesigner: data.branddesigner,
        price: data.price,
        discountprice: data.discountprice,
        stock: data.stock,
        isactive: data.isactive,
        isfeatured: data.isfeatured,
        uploadeddate: new Date().toISOString(),
        images: imageUrls.map((url, index) => ({
          url,
          is_hero: index === parseInt(heroImageIndex),
        })),
      };

      // Create product
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
      toast.error(err.response?.data?.message || err.message || 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Custom styles for react-select to match theme
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      border: errors.categoryid ? '1px solid #EF4444' : '0px solid #D1D5DB',
      borderRadius: '6px',
      backgroundColor: '#FFFFFF',
      boxShadow: state.isFocused ? '0 0 0 2px #D4A5A5' : 'none',
      borderColor: state.isFocused ? '#D4A5A5' : errors.categoryid ? '#EF4444' : '#D1D5DB',
      '&:hover': {
        borderColor: '#D4A5A5',
      },
      fontSize: '1rem',
      lineHeight: '1.5rem',
    }),
    menu: (provided) => ({
      ...provided,
      border: '1px solid #D4A5A5',
      borderRadius: '6px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      backgroundColor: '#FFFFFF',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#D4A5A5' : state.isFocused ? '#F3E8E8' : '#FFFFFF',
      color: state.isSelected ? '#FFFFFF' : '#111827',
      padding: '0.5rem 1rem',
      '&:hover': {
        backgroundColor: '#F3E8E8',
        color: '#111827',
      },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#111827',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9CA3AF',
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: '#D4A5A5',
      '&:hover': {
        color: '#C39898',
      },
    }),
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-1">
          <input
            type="text"
            placeholder="Product Name"
            className={`rounded-md px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-[#D4A5A5] ${errors.name ? 'border-red-500' : ''}`}
            {...register('name', { 
              required: 'Product name is required',
              minLength: { value: 2, message: 'Name must be at least 2 characters' },
            })}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>

        <div className="col-span-1">
          <input
            type="text"
            placeholder="Brand/Designer"
            className={`rounded-md px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-[#D4A5A5] ${errors.branddesigner ? 'border-red-500' : ''}`}
            {...register('branddesigner', { 
              required: 'Brand/Designer is required',
              minLength: { value: 2, message: 'Brand/Designer must be at least 2 characters' },
            })}
          />
          {errors.branddesigner && <p className="text-red-500 text-sm mt-1">{errors.branddesigner.message}</p>}
        </div>

        <div className="col-span-2">
          <textarea
            placeholder="Description"
            className={`rounded-md px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-[#D4A5A5] ${errors.description ? 'border-red-500' : ''}`}
            {...register('description', { required: 'Description is required' })}
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
        </div>

        <div className="col-span-2">
          <input
            type="text"
            placeholder="Short Description"
            className={`rounded-md px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-[#D4A5A5] ${errors.shortdescription ? 'border-red-500' : ''}`}
            {...register('shortdescription', { required: 'Short description is required' })}
          />
          {errors.shortdescription && <p className="text-red-500 text-sm mt-1">{errors.shortdescription.message}</p>}
        </div>

        <div className="col-span-1">
          <Select
            options={categories.map(category => ({
              value: category.id,
              label: category.name,
            }))}
            onChange={(selectedOption) => setValue('categoryid', selectedOption ? selectedOption.value : '')}
            placeholder="Select Category"
            styles={customSelectStyles}
            isClearable
            classNamePrefix="react-select"
            className={errors.categoryid ? 'border-red-500' : ''}
          />
          {errors.categoryid && <p className="text-red-500 text-sm mt-1">{errors.categoryid.message}</p>}
        </div>

        <div className="col-span-1">
          <input
            type="number"
            placeholder="Price (₹)"
            className={`rounded-md px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-[#D4A5A5] ${errors.price ? 'border-red-500' : ''}`}
            {...register('price', { 
              required: 'Price is required',
              min: { value: 0, message: 'Price must be positive' },
            })}
          />
          {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>}
        </div>

        <div className="col-span-1">
          <input
            type="number"
            placeholder="Discount Price (₹)"
            className={`rounded-md px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-[#D4A5A5] ${errors.discountprice ? 'border-red-500' : ''}`}
            {...register('discountprice', { 
              min: { value: 0, message: 'Discount price must be positive' },
            })}
          />
          {errors.discountprice && <p className="text-red-500 text-sm mt-1">{errors.discountprice.message}</p>}
        </div>

        <div className="col-span-1">
          <input
            type="number"
            placeholder="Stock"
            className={`rounded-md px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-[#D4A5A5] ${errors.stock ? 'border-red-500' : ''}`}
            {...register('stock', { 
              required: 'Stock is required',
              min: { value: 0, message: 'Stock must be positive' },
            })}
          />
          {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock.message}</p>}
        </div>

        <div className="col-span-1">
          <label className="flex items-center px-4">
            <input
              type="checkbox"
              className="mr-2"
              {...register('isactive')}
            />
            Active
          </label>
        </div>

        <div className="col-span-1">
          <label className="flex items-center px-4">
            <input
              type="checkbox"
              className="mr-2"
              {...register('isfeatured')}
            />
            Featured
          </label>
        </div>

        <div className="col-span-2">
          <input
            type="file"
            accept="image/*"
            multiple
            className={`input col-span-2 px-4 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-white file:font-semibold file:bg-[#D4A5A5] file:hover:bg-[#C39898] file:transition ${errors.images ? 'border-red-500' : ''}`}
            {...register('images', {
              required: 'At least one image is required',
              validate: {
                fileType: files => Array.from(files).every(file => file.type.startsWith('image/')) || 'Please select image files only',
                minCount: files => files.length >= 1 || 'At least one image is required',
              }
            })}
            onChange={handleImageChange}
          />
          {errors.images && <p className="text-red-500 text-sm mt-1">{errors.images.message}</p>}
        </div>

        {selectedImages.length > 0 && (
          <div className="col-span-2">
            <p className="text-sm font-semibold mb-2">Select Hero Image:</p>
            <div className="grid grid-cols-3 gap-4">
              {selectedImages.map((file, index) => (
                <div key={index} className="flex flex-col items-center">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index}`}
                    className={`w-24 h-24 object-cover rounded-md ${heroImageIndex === index ? 'ring-2 ring-[#D4A5A5]' : ''}`}
                    onClick={() => setHeroImageIndex(index)}
                  />
                  <p className="text-sm mt-1">{heroImageIndex === index ? 'Hero Image' : 'Click to set as Hero'}</p>
                </div>
              ))}
            </div>
            {heroImageIndex === null && selectedImages.length > 0 && (
              <p className="text-red-500 text-sm mt-2">Please select a hero image</p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || heroImageIndex === null}
          className="bg-[#D4A5A5] hover:bg-[#C39898] text-white px-6 py-3 rounded-md transition font-semibold shadow col-span-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Adding Product...' : 'Add Product'}
        </button>
      </form>
    </div>
  );
};

export default AddProduct;