'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  Upload,
  ClipboardPaste,
  Image as ImageIcon,
  FolderTree,
  ChevronRight,
  Check,
  X,
  Loader2,
  Package,
} from 'lucide-react';
import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  getAdminSubcategories,
  createAdminSubcategory,
  updateAdminSubcategory,
  deleteAdminSubcategory,
} from '@/lib/api';
import { compressImage } from '@/lib/imageUtils';

export default function AdminCategoriesManager() {
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' | 'subcategories'
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Modals state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, subRes] = await Promise.all([
        getAdminCategories().catch(() => ({ data: [] })),
        getAdminSubcategories().catch(() => ({ data: [] })),
      ]);
      setCategories(catRes.data?.data || catRes.data || []);
      setSubcategories(subRes.data?.data || subRes.data || []);
    } catch (err) {
      console.error('Failed to load categories/subcategories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Category Actions
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat) => {
    setEditingCategory(cat);
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = async (cat) => {
    if (
      !confirm(
        `Are you sure you want to delete category "${cat.name}"? This will also delete all subcategories under it.`
      )
    ) {
      return;
    }

    try {
      await deleteAdminCategory(cat._id);
      showToast(`Deleted category "${cat.name}" successfully`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete category');
    }
  };

  // Subcategory Actions
  const handleOpenAddSubcategory = () => {
    setEditingSubcategory(null);
    setIsSubcategoryModalOpen(true);
  };

  const handleOpenEditSubcategory = (sub) => {
    setEditingSubcategory(sub);
    setIsSubcategoryModalOpen(true);
  };

  const handleDeleteSubcategory = async (sub) => {
    if (!confirm(`Are you sure you want to delete subcategory "${sub.name}"?`)) {
      return;
    }

    try {
      await deleteAdminSubcategory(sub._id);
      showToast(`Deleted subcategory "${sub.name}" successfully`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete subcategory');
    }
  };

  // Filtered Main Categories
  const filteredCategories = categories.filter((cat) => {
    if (searchQuery.trim()) {
      return cat.name?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  // Filtered Subcategories
  const filteredSubcategories = subcategories.filter((sub) => {
    const parentId = sub.category?._id || sub.category;
    if (filterCategory !== 'all' && String(parentId) !== String(filterCategory)) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const parentName = sub.category?.name || '';
      return sub.name?.toLowerCase().includes(q) || parentName.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl transition">
          {toastMessage}
        </div>
      )}

      {/* Top Header & Tab Controls */}
      <div className="p-4 sm:p-5 border-b border-gray-100 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-[#0C831F]" />
              <span>Categories & Subcategories Manager</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Create main categories for the homepage and subcategories for the category store page.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-[#0C831F] hover:bg-green-50 rounded-xl transition cursor-pointer"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {activeTab === 'categories' ? (
              <button
                type="button"
                onClick={handleOpenAddCategory}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0C831F] hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenAddSubcategory}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0C831F] hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Subcategory</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher & Filter Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center p-1 bg-gray-100 rounded-xl w-max">
            <button
              type="button"
              onClick={() => {
                setActiveTab('categories');
                setSearchQuery('');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Main Categories ({categories.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('subcategories');
                setSearchQuery('');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'subcategories'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Subcategories ({subcategories.length})
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={
                  activeTab === 'categories'
                    ? 'Search categories by name...'
                    : 'Search subcategories...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#0C831F]"
              />
            </div>

            {activeTab === 'subcategories' && (
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-xs text-gray-700 py-1.5 px-2.5 rounded-xl focus:outline-none focus:border-[#0C831F]"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : activeTab === 'categories' ? (
          /* Categories Tab Grid */
          filteredCategories.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8 max-w-md mx-auto">
              <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-gray-800">No Categories Found</h3>
              <p className="text-xs text-gray-500 mt-1 mb-4">
                Get started by clicking &quot;Add Category&quot; to create your first storefront category.
              </p>
              <button
                type="button"
                onClick={handleOpenAddCategory}
                className="px-4 py-2 bg-[#0C831F] text-white text-xs font-bold rounded-xl hover:bg-green-700 transition"
              >
                + Add Category
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {filteredCategories.map((cat) => (
                <div
                  key={cat._id}
                  className="bg-white rounded-2xl border border-gray-200 p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-md transition group"
                >
                  <div>
                    {/* Category Image Box */}
                    <div className="w-full aspect-square bg-[#F4F6FB] rounded-xl border border-gray-100 flex items-center justify-center p-2 mb-3 overflow-hidden">
                      {cat.image ? (
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition duration-200"
                        />
                      ) : (
                        <span className="text-2xl font-black text-[#0C831F]">
                          {cat.name?.charAt(0)}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-1">
                      {cat.name}
                    </h3>

                    {/* Stats pills */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                      <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                        {cat.subcategoriesCount || 0} subcategories
                      </span>
                      <span className="text-[10px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                        {cat.itemCount || 0} items
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                    <span className="text-[10px] text-gray-400 font-mono">
                      Order: {cat.displayOrder || 0}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditCategory(cat)}
                        className="p-1.5 text-gray-600 hover:text-[#0C831F] hover:bg-green-50 rounded-lg transition"
                        title="Edit Category"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Subcategories Tab Grid */
          filteredSubcategories.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8 max-w-md mx-auto">
              <FolderTree className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-gray-800">No Subcategories Found</h3>
              <p className="text-xs text-gray-500 mt-1 mb-4">
                Add subcategories under your main categories to organize products in the Zepto-style category view.
              </p>
              <button
                type="button"
                onClick={handleOpenAddSubcategory}
                className="px-4 py-2 bg-[#0C831F] text-white text-xs font-bold rounded-xl hover:bg-green-700 transition"
              >
                + Add Subcategory
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {filteredSubcategories.map((sub) => {
                const parentName = sub.category?.name || 'Unassigned';
                return (
                  <div
                    key={sub._id}
                    className="bg-white rounded-2xl border border-gray-200 p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-md transition group"
                  >
                    <div>
                      {/* Subcategory Image Box */}
                      <div className="w-full aspect-square bg-[#F4F6FB] rounded-xl border border-gray-100 flex items-center justify-center p-2 mb-2.5 overflow-hidden">
                        {sub.image ? (
                          <img
                            src={sub.image}
                            alt={sub.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition duration-200"
                          />
                        ) : (
                          <span className="text-2xl font-black text-gray-400">
                            {sub.name?.charAt(0)}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-bold text-[#0C831F] bg-green-50 px-2 py-0.5 rounded-md border border-green-200 inline-block mb-1">
                        {parentName}
                      </span>

                      <h3 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-1">
                        {sub.name}
                      </h3>

                      <span className="text-[10px] text-gray-500 mt-1 block">
                        {sub.itemCount || 0} items assigned
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                      <span className="text-[10px] text-gray-400 font-mono">
                        Order: {sub.displayOrder || 0}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditSubcategory(sub)}
                          className="p-1.5 text-gray-600 hover:text-[#0C831F] hover:bg-green-50 rounded-lg transition"
                          title="Edit Subcategory"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubcategory(sub)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Subcategory"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Category Modal (Add / Edit) */}
      {isCategoryModalOpen && (
        <CategoryModal
          isOpen={isCategoryModalOpen}
          category={editingCategory}
          onClose={() => {
            setIsCategoryModalOpen(false);
            setEditingCategory(null);
          }}
          onSaved={() => {
            setIsCategoryModalOpen(false);
            setEditingCategory(null);
            fetchData();
            showToast('Category saved successfully!');
          }}
        />
      )}

      {/* Subcategory Modal (Add / Edit) */}
      {isSubcategoryModalOpen && (
        <SubcategoryModal
          isOpen={isSubcategoryModalOpen}
          subcategory={editingSubcategory}
          categories={categories}
          defaultCategoryId={filterCategory !== 'all' ? filterCategory : ''}
          onClose={() => {
            setIsSubcategoryModalOpen(false);
            setEditingSubcategory(null);
          }}
          onSaved={() => {
            setIsSubcategoryModalOpen(false);
            setEditingSubcategory(null);
            fetchData();
            showToast('Subcategory saved successfully!');
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Category Modal Component
// ─────────────────────────────────────────────
function CategoryModal({ isOpen, category, onClose, onSaved }) {
  const [name, setName] = useState(category?.name || '');
  const [image, setImage] = useState(category?.image || '');
  const [displayOrder, setDisplayOrder] = useState(category?.displayOrder || 0);
  const [active, setActive] = useState(category?.active !== false);
  const [compressing, setCompressing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const isEditing = Boolean(category?._id);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    setError('');
    try {
      const dataUrl = await compressImage(file, { maxWidth: 600, maxHeight: 600, quality: 0.85 });
      setImage(dataUrl);
    } catch (err) {
      setError(err.message || 'Failed to compress image');
    } finally {
      setCompressing(false);
    }
  };

  // Clipboard Paste Handler (Ctrl+V)
  const handlePaste = useCallback(
    async (e) => {
      const clipboardData = e.clipboardData || window.clipboardData;
      if (!clipboardData) return;

      const items = clipboardData.items;
      if (!items || items.length === 0) return;

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.type && it.type.startsWith('image/')) {
          const file = it.getAsFile();
          if (file) {
            e.preventDefault();
            setCompressing(true);
            setError('');
            try {
              const dataUrl = await compressImage(file, { maxWidth: 600, maxHeight: 600, quality: 0.85 });
              setImage(dataUrl);
            } catch (err) {
              setError(err.message || 'Failed to compress pasted photo');
            } finally {
              setCompressing(false);
            }
            return;
          }
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!isOpen) return;
    const onWindowPaste = (e) => handlePaste(e);
    window.addEventListener('paste', onWindowPaste);
    return () => window.removeEventListener('paste', onWindowPaste);
  }, [isOpen, handlePaste]);

  const handlePasteFromClipboard = async () => {
    setError('');
    try {
      if (navigator.clipboard?.read) {
        const clipboardItems = await navigator.clipboard.read();
        for (const cItem of clipboardItems) {
          for (const type of cItem.types) {
            if (type.startsWith('image/')) {
              const blob = await cItem.getType(type);
              const file = new File([blob], `pasted-${Date.now()}.${type.split('/')[1] || 'png'}`, { type });
              setCompressing(true);
              const dataUrl = await compressImage(file, { maxWidth: 600, maxHeight: 600, quality: 0.85 });
              setImage(dataUrl);
              setCompressing(false);
              return;
            }
          }
        }
      }

      // Check text URL
      const text = await navigator.clipboard?.readText();
      if (text && (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:image/'))) {
        setImage(text.trim());
      } else {
        setError('No copied image found in clipboard. Please copy a photo first, then click Paste or press Ctrl+V.');
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
      setError('Please click inside this modal and press Ctrl+V on your keyboard to paste.');
    } finally {
      setCompressing(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        name: name.trim(),
        image: image.trim(),
        displayOrder: Number(displayOrder) || 0,
        active,
      };

      if (isEditing) {
        await updateAdminCategory(category._id, payload);
      } else {
        await createAdminCategory(payload);
      }

      onSaved();
    } catch (err) {
      console.error('Failed to save category:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-sm font-black text-gray-900">
            {isEditing ? 'Edit Category' : 'Add New Category'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Cooking Oils & Ghee, Dals, Atta..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#0C831F]"
            />
          </div>

          {/* Image Upload & Preview */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Category Photo (Image)
            </label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {image ? (
                  <img src={image} alt="Preview" className="w-full h-full object-contain p-1" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-gray-300" />
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={compressing}
                    className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {compressing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Wait...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photo</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    disabled={compressing}
                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#0C831F] border border-emerald-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                    title="Paste copied photo or press Ctrl+V"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>Paste (Ctrl+V)</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Or paste image URL..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-2.5 py-1 text-[11px] text-gray-600 focus:outline-none focus:border-[#0C831F]"
                />
              </div>
            </div>
          </div>

          {/* Display Order */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Display Order</label>
              <input
                type="number"
                min="0"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#0C831F]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
              <button
                type="button"
                onClick={() => setActive(!active)}
                className={`w-full py-1.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  active
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-gray-100 text-gray-500 border-gray-300'
                }`}
              >
                {active ? 'Active' : 'Hidden'}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#0C831F] hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Subcategory Modal Component
// ─────────────────────────────────────────────
function SubcategoryModal({ isOpen, subcategory, categories, defaultCategoryId, onClose, onSaved }) {
  const [name, setName] = useState(subcategory?.name || '');
  const [category, setCategory] = useState(
    subcategory?.category?._id || subcategory?.category || defaultCategoryId || ''
  );
  const [image, setImage] = useState(subcategory?.image || '');
  const [displayOrder, setDisplayOrder] = useState(subcategory?.displayOrder || 0);
  const [active, setActive] = useState(subcategory?.active !== false);
  const [compressing, setCompressing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const isEditing = Boolean(subcategory?._id);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    setError('');
    try {
      const dataUrl = await compressImage(file, { maxWidth: 600, maxHeight: 600, quality: 0.85 });
      setImage(dataUrl);
    } catch (err) {
      setError(err.message || 'Failed to compress image');
    } finally {
      setCompressing(false);
    }
  };

  const handlePaste = useCallback(
    async (e) => {
      const clipboardData = e.clipboardData || window.clipboardData;
      if (!clipboardData) return;

      const items = clipboardData.items;
      if (!items || items.length === 0) return;

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.type && it.type.startsWith('image/')) {
          const file = it.getAsFile();
          if (file) {
            e.preventDefault();
            setCompressing(true);
            setError('');
            try {
              const dataUrl = await compressImage(file, { maxWidth: 600, maxHeight: 600, quality: 0.85 });
              setImage(dataUrl);
            } catch (err) {
              setError(err.message || 'Failed to compress pasted photo');
            } finally {
              setCompressing(false);
            }
            return;
          }
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!isOpen) return;
    const onWindowPaste = (e) => handlePaste(e);
    window.addEventListener('paste', onWindowPaste);
    return () => window.removeEventListener('paste', onWindowPaste);
  }, [isOpen, handlePaste]);

  const handlePasteFromClipboard = async () => {
    setError('');
    try {
      if (navigator.clipboard?.read) {
        const clipboardItems = await navigator.clipboard.read();
        for (const cItem of clipboardItems) {
          for (const type of cItem.types) {
            if (type.startsWith('image/')) {
              const blob = await cItem.getType(type);
              const file = new File([blob], `pasted-${Date.now()}.${type.split('/')[1] || 'png'}`, { type });
              setCompressing(true);
              const dataUrl = await compressImage(file, { maxWidth: 600, maxHeight: 600, quality: 0.85 });
              setImage(dataUrl);
              setCompressing(false);
              return;
            }
          }
        }
      }

      // Check text URL
      const text = await navigator.clipboard?.readText();
      if (text && (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:image/'))) {
        setImage(text.trim());
      } else {
        setError('No copied image found in clipboard. Please copy a photo first, then click Paste or press Ctrl+V.');
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
      setError('Please click inside this modal and press Ctrl+V on your keyboard to paste.');
    } finally {
      setCompressing(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Subcategory name is required');
      return;
    }
    if (!category) {
      setError('Please select a parent category');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        name: name.trim(),
        category,
        image: image.trim(),
        displayOrder: Number(displayOrder) || 0,
        active,
      };

      if (isEditing) {
        await updateAdminSubcategory(subcategory._id, payload);
      } else {
        await createAdminSubcategory(payload);
      }

      onSaved();
    } catch (err) {
      console.error('Failed to save subcategory:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save subcategory');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-sm font-black text-gray-900">
            {isEditing ? 'Edit Subcategory' : 'Add New Subcategory'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* Parent Category */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Parent Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#0C831F]"
            >
              <option value="">-- Choose Category --</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Subcategory Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sunflower Oil, Mustard Oil, Raw Peanuts..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#0C831F]"
            />
          </div>

          {/* Image Upload & Preview */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Subcategory Icon / Photo
            </label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {image ? (
                  <img src={image} alt="Preview" className="w-full h-full object-contain p-1" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-gray-300" />
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={compressing}
                    className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {compressing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Wait...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photo</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    disabled={compressing}
                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#0C831F] border border-emerald-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                    title="Paste copied photo or press Ctrl+V"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>Paste (Ctrl+V)</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Or paste image URL..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-2.5 py-1 text-[11px] text-gray-600 focus:outline-none focus:border-[#0C831F]"
                />
              </div>
            </div>
          </div>

          {/* Display Order */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Display Order</label>
              <input
                type="number"
                min="0"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#0C831F]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
              <button
                type="button"
                onClick={() => setActive(!active)}
                className={`w-full py-1.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  active
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-gray-100 text-gray-500 border-gray-300'
                }`}
              >
                {active ? 'Active' : 'Hidden'}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#0C831F] hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Subcategory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
