const BannerManager = () => {
  return (
    <form className="max-w-3xl mx-auto grid grid-cols-1 gap-4 sm:gap-6">
      {/* Banner Title */}
      <div>
        <label className="block text-sm font-medium text-[#6B4226] mb-1">
          Banner Title
        </label>
        <input
          type="text"
          placeholder="Enter banner title"
          className="w-full rounded-md px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-[#D4A5A5]"
        />
      </div>

      {/* Banner Message */}
      <div>
        <label className="block text-sm font-medium text-[#6B4226] mb-1">
          Message / Description
        </label>
        <textarea
          placeholder="Write a short description for the banner"
          className="w-full rounded-md px-4 py-2 border border-gray-300 h-28 resize-none focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-[#D4A5A5]"
        />
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-[#6B4226] mb-1">
          Banner Image
        </label>
        <input
          type="file"
          accept="image/*"
          className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#D4A5A5] file:text-white hover:file:bg-[#C39898]"
        />
      </div>

      {/* Save Button */}
      <div>
        <button
          type="submit"
          className="bg-[#D4A5A5] hover:bg-[#C39898] text-white px-6 py-3 rounded-md transition font-semibold shadow w-full sm:w-auto"
        >
          Save Banner
        </button>
      </div>
    </form>
  );
};

export default BannerManager;
