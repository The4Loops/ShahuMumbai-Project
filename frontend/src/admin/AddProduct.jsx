const AddProduct = () => {
  return (
    <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <input type="text" placeholder="Product Name" className="input" />
      <input type="text" placeholder="Designer" className="input" />
      <input type="text" placeholder="Color" className="input" />
      <input type="text" placeholder="Category" className="input" />
      <input type="number" placeholder="Price (₹)" className="input" />
      <input type="number" placeholder="Quantity" className="input" />
      <input type="file" multiple className="input col-span-2" />
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