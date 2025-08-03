const Analytics = () => {
  const metrics = [
    { title: 'Total Users', value: 134 },
    { title: 'Returning Visitors', value: 27 },
    { title: 'Conversion Rate', value: '4.3%' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {metrics.map((metric, idx) => (
        <div key={idx} className="bg-[#fff8f4] p-6 rounded-lg border shadow text-center">
          <h3 className="text-lg text-[#6B4226] font-semibold">{metric.title}</h3>
          <p className="text-3xl text-[#6B4226] font-bold mt-2">{metric.value}</p>
        </div>
      ))}
    </div>
  );
};

export default Analytics;