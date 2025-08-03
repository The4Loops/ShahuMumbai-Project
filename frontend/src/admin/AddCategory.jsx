const AddCategory = () => {
  return (
    <form className="grid gap-4">
      <input type="text" placeholder="Category Name" className="rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-[#D4A5A5]" />
      <button
        className="bg-[#D4A5A5] hover:bg-[#C39898] text-white px-6 py-3 rounded-md transition font-semibold shadow"
      >
        Add Category
      </button>
    </form>
  );
};

export default AddCategory;