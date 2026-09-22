export default function CheckoutPage() {
  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h1 className="text-xl font-bold mb-4">Checkout</h1>
      <div className="bg-white p-4 rounded-xl mb-4 border">
        <h2 className="font-bold mb-2">Delivery Address</h2>
        <p className="text-sm text-gray-600">Koramangala, Bangalore</p>
      </div>
      <div className="bg-white p-4 rounded-xl mb-4 border">
        <h2 className="font-bold mb-2">Payment</h2>
        <label className="flex items-center space-x-2 text-sm">
          <input type="radio" checked readOnly className="text-[#0C831F]" />
          <span>Cash on Delivery (COD)</span>
        </label>
      </div>
      <button className="w-full bg-[#0C831F] text-white py-3 rounded-xl font-bold">
        Place Order
      </button>
    </div>
  );
}
