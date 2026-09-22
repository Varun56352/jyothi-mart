export default function SearchPage() {
  return (
    <div className="p-4 min-h-screen bg-gray-50">
       <input type="text" placeholder="Search groceries..." className="w-full px-4 py-3 border rounded-xl focus:border-[#0C831F] focus:outline-none mb-4 shadow-sm" autoFocus />
       <div className="text-center text-gray-500 mt-10">Start typing to search products...</div>
    </div>
  );
}
