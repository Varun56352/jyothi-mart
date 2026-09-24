'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Upload, Trash2, Star, Image as ImageIcon, Loader2, ClipboardPaste } from 'lucide-react';
import { compressImage } from '@/lib/imageUtils';
import { updateAdminItem } from '@/lib/api';

export default function ProductImageModal({ item, isOpen, onClose, onSaveSuccess }) {
  const [images, setImages] = useState([]);
  const [compressing, setCompressing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (item) {
      setImages(Array.isArray(item.images) ? [...item.images] : []);
      setError('');
    }
  }, [item]);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setError('');
    setCompressing(true);

    try {
      const compressedList = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const compressed = await compressImage(file, { maxWidth: 1000, maxHeight: 1000, quality: 0.82 });
        compressedList.push(compressed);
      }
      setImages((prev) => [...prev, ...compressedList]);
    } catch (err) {
      console.error('Image compression failed:', err);
      setError(err.message || 'Failed to process selected images');
    } finally {
      setCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Clipboard Paste Handlers (Ctrl+V and Paste Button)
  const handlePaste = useCallback(
    async (e) => {
      const clipboardData = e.clipboardData || window.clipboardData;
      if (!clipboardData) return;

      const items = clipboardData.items;
      if (!items || items.length === 0) return;

      const imageFiles = [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.type && it.type.startsWith('image/')) {
          const file = it.getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        await handleFiles(imageFiles);
      }
    },
    []
  );

  useEffect(() => {
    if (!isOpen) return;
    const onWindowPaste = (e) => {
      handlePaste(e);
    };
    window.addEventListener('paste', onWindowPaste);
    return () => window.removeEventListener('paste', onWindowPaste);
  }, [isOpen, handlePaste]);

  const handlePasteFromClipboardButton = async () => {
    setError('');
    try {
      if (navigator.clipboard?.read) {
        const clipboardItems = await navigator.clipboard.read();
        const imageFiles = [];
        for (const cItem of clipboardItems) {
          for (const type of cItem.types) {
            if (type.startsWith('image/')) {
              const blob = await cItem.getType(type);
              const file = new File(
                [blob],
                `pasted-${Date.now()}.${type.split('/')[1] || 'png'}`,
                { type }
              );
              imageFiles.push(file);
            }
          }
        }
        if (imageFiles.length > 0) {
          await handleFiles(imageFiles);
          return;
        }
      }

      // Check if image URL in clipboard text
      const text = await navigator.clipboard?.readText();
      if (text && (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:image/'))) {
        setImages((prev) => [...prev, text.trim()]);
      } else {
        setError('No copied image found in clipboard. Please copy a photo first, then click Paste or press Ctrl+V.');
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
      setError('Please click inside this modal and press Ctrl+V on your keyboard to paste.');
    }
  };

  if (!isOpen || !item) return null;

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSetPrimary = (index) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const [selected] = copy.splice(index, 1);
      copy.unshift(selected);
      return copy;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await updateAdminItem(item._id, { images });
      if (onSaveSuccess) {
        onSaveSuccess({ ...item, images });
      }
      onClose();
    } catch (err) {
      console.error('Failed to save item images:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save images');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900 leading-tight">Product Images</h2>
            <p className="text-xs text-gray-500 truncate max-w-md">{item.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-2.5 rounded-xl">
              {error}
            </div>
          )}

          {/* Upload Drop Area */}
          <div className="border-2 border-dashed border-gray-300 hover:border-[#0C831F] bg-gray-50 rounded-2xl p-6 text-center transition flex flex-col items-center justify-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            {compressing ? (
              <div className="flex items-center gap-2 text-sm text-[#0C831F] font-semibold">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Optimizing and compressing images...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2.5 w-full">
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#0C831F]" />
                    <span>Upload from Device</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePasteFromClipboardButton}
                    className="px-3.5 py-2 bg-[#0C831F] hover:bg-green-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>Paste Copied Photo</span>
                  </button>
                </div>

                <p className="text-[11px] text-gray-500 font-medium">
                  Or simply copy any photo and press{' '}
                  <kbd className="px-1.5 py-0.5 bg-gray-200 border border-gray-300 rounded text-[10px] font-mono text-gray-800">
                    Ctrl + V
                  </kbd>{' '}
                  anywhere to paste directly!
                </p>
              </div>
            )}
          </div>

          {/* Image Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Uploaded Images ({images.length})
              </span>
              {images.length > 0 && (
                <span className="text-[11px] text-gray-400">First image is the main cover</span>
              )}
            </div>

            {images.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100 text-gray-400">
                <ImageIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-xs">No images uploaded yet for this product.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group bg-gray-100 rounded-xl overflow-hidden border border-gray-200 aspect-square flex items-center justify-center"
                  >
                    <img
                      src={img}
                      alt={`Product ${idx + 1}`}
                      className="w-full h-full object-contain p-2"
                    />

                    {/* Primary Badge */}
                    {idx === 0 && (
                      <span className="absolute top-2 left-2 bg-[#0C831F] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" /> Cover
                      </span>
                    )}

                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(idx)}
                          title="Make Cover Image"
                          className="p-2 bg-white text-gray-800 hover:text-[#0C831F] rounded-lg shadow-sm transition"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        title="Delete image"
                        className="p-2 bg-white text-red-600 hover:bg-red-50 rounded-lg shadow-sm transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || compressing}
            className="px-5 py-2 bg-[#0C831F] hover:bg-green-700 text-white text-sm font-bold rounded-xl shadow-sm transition flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Images</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
