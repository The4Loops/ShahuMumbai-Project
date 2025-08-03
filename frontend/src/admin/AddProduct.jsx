const AddProduct = () => {
  return (
    <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <input type="text" placeholder="Product Name" className="rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-[#D4A5A5]" />
      <input type="text" placeholder="Designer" className="rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-[#D4A5A5]" />
      <input type="text" placeholder="Color" className="rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-[#D4A5A5]" />
      <input type="text" placeholder="Category" className="rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-[#D4A5A5]" />
      <input type="number" placeholder="Price (₹)" className="rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-[#D4A5A5]" />
      <input type="number" placeholder="Quantity" className="rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-[#D4A5A5]" />
      <input
        type="file"
        multiple
        className="input col-span-2 
          file:mr-4 file:py-2 file:px-4 
          file:rounded-md file:border-0 
          file:text-white file:font-semibold 
          file:bg-[#D4A5A5] file:hover:bg-[#C39898] 
          file:transition"
      />
      <button
        type="submit"
        className="bg-[#D4A5A5] hover:bg-[#C39898] text-white px-6 py-3 rounded-md transition font-semibold shadow col-span-2"
      >
        Add Product
      </button>
    </form>
  );
};

export default AddProduct;