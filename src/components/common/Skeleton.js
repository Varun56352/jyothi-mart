'use client';
import { cn } from '@/lib/utils';

export function SkeletonCard({ className }) {
  return (
    <div className={cn("animate-pulse bg-gray-200 rounded-xl h-64", className)} />
  );
}

export function SkeletonText({ width = 'w-full', height = 'h-4', className }) {
  return (
    <div className={cn("animate-pulse bg-gray-200 rounded", width, height, className)} />
  );
}

export function SkeletonCircle({ size = 'w-10 h-10', className }) {
  return (
    <div className={cn("animate-pulse bg-gray-200 rounded-full", size, className)} />
  );
}
