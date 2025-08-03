const OrderDashboard = () => {
  const orders = [
    { id: 'ORD123', customer: 'Riya', status: 'Pending' },
    { id: 'ORD124', customer: 'Aarav', status: 'Shipped' },
    { id: 'ORD125', customer: 'Kunal', status: 'Delivered' },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-[#6B4226] mb-4">Recent Orders</h2>
      <ul className="space-y-3">
        {orders.map((order) => (
          <li
            key={order.id}
            className="flex justify-between items-center p-4 border rounded-md bg-[#fff8f4]"
          >
            <span>{order.id} - {order.customer}</span>
            <span
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                order.status === 'Delivered' ? 'bg-green-200' :
                order.status === 'Shipped' ? 'bg-yellow-200' :
                'bg-red-200'
              }`}
            >
              {order.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OrderDashboard;