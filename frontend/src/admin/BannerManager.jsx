const BannerManager = () => {
  return (
    <form className="grid gap-4">
      <input type="text" placeholder="Banner Title" className="input" />
      <textarea placeholder="Message/Description" className="input h-28" />
      <input type="file" accept="image/*" className="input" />
      <button
        className="bg-[#D4A5A5] hover:bg-[#C39898] text-white px-6 py-3 rounded-md transition font-semibold shadow"
      >
        Save Banner
      </button>
    </form>
  );
};

export default BannerManager;