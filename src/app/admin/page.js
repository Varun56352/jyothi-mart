export default function AdminPage() {
  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Admin Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Orders Today</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">24</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Pending</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">5</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Revenue Today</p>
          <p className="text-2xl font-bold text-[#0C831F] mt-1">₹4,250</p>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h2 className="font-bold text-lg mb-4">Quick Links</h2>
            <ul className="space-y-3">
              <li><a href="/admin/orders" className="text-blue-600 hover:underline">Manage Orders</a></li>
              <li><a href="/admin/items" className="text-blue-600 hover:underline">Manage Catalog Items</a></li>
              <li><a href="/admin/settings" className="text-blue-600 hover:underline">Store Settings</a></li>
            </ul>
         </div>
      </div>
    </div>
  );
}
