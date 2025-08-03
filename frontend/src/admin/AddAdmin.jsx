const AddAdmin = () => {
  return (
    <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <input type="text" placeholder="Full Name" className="rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-[#D4A5A5]" />
      <input type="email" placeholder="Email" className="rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-[#D4A5A5]" />
      <input type="password" placeholder="Password" className="rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-[#D4A5A5]" />
      <input type="password" placeholder="Confirm Password" className="rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-[#D4A5A5]" />
      <button
        type="submit"
        className="bg-[#D4A5A5] hover:bg-[#C39898] text-white px-6 py-3 rounded-md transition font-semibold shadow col-span-2"
      >
        Add Admin
      </button>
    </form>
  );
};

export default AddAdmin;