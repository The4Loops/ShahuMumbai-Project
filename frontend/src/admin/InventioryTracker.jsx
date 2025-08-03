
const InventoryTracker = () => {
  const products = [
    { name: 'Vintage Bag', quantity: 5 },
    { name: 'Tote Bag', quantity: 0 },
    { name: 'Pouch', quantity: 12 },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-[#6B4226] mb-4">Inventory</h2>
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-[#fff1eb] text-[#6B4226]">
            <th className="p-3 border">Product</th>
            <th className="p-3 border">Quantity</th>
            <th className="p-3 border">Status</th>
          </tr>
        </thead>
        <tbody>
          {products.map((prod, idx) => (
            <tr key={idx} className="text-center">
              <td className="border p-2">{prod.name}</td>
              <td className="border p-2">{prod.quantity}</td>
              <td className="border p-2">
                {prod.quantity === 0 ? (
                  <span className="text-red-500 font-semibold">Out of Stock</span>
                ) : (
                  <span className="text-green-600">In Stock</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default InventoryTracker