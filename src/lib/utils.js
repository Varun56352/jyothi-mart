import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export function getStockStatus(stock) {
  if (stock <= 0) return { label: 'Out of Stock', color: 'text-red-600 bg-red-50' };
  if (stock < 10) return { label: 'Low Stock', color: 'text-orange-600 bg-orange-50' };
  return { label: 'In Stock', color: 'text-green-700 bg-green-50' };
}

export function getOrderStatusColor(status) {
  const colors = {
    placed: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    packing: 'bg-orange-100 text-orange-800',
    out_for_delivery: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getOrderStatusLabel(status) {
  const labels = {
    placed: 'Placed',
    confirmed: 'Confirmed',
    packing: 'Packing',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  };
  return labels[status] || status;
}
