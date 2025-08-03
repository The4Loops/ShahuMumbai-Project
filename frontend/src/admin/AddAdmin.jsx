const AddAdmin = () => {
  return (
    <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <input type="text" placeholder="Full Name" className="input" />
      <input type="email" placeholder="Email" className="input" />
      <input type="password" placeholder="Password" className="input" />
      <input type="password" placeholder="Confirm Password" className="input" />
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