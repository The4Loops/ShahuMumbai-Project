const AddCategory = () => {
  return (
    <form className="grid gap-4">
      <input type="text" placeholder="Category Name" className="input" />
      <textarea placeholder="Category Description" className="input h-24" />
      <button
        className="bg-[#D4A5A5] hover:bg-[#C39898] text-white px-6 py-3 rounded-md transition font-semibold shadow"
      >
        Add Category
      </button>
    </form>
  );
};

export default AddCategory;