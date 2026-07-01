import { useEffect, useState, useCallback } from 'react';
import { Package, Plus, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/products.api';
import { getBrands } from '../api/brands.api';
import { getCategories } from '../api/categories.api';
import { formatCurrency } from '../utils/currency';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Pagination from '../components/common/Pagination';
import LowStockBadge from '../components/common/LowStockBadge';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import ProductForm from '../components/forms/ProductForm';

export default function Products() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === 'ADMIN';

  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [brandId, setBrandId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadProducts = useCallback(() => {
    setLoading(true);
    getProducts({
      page,
      search: search || undefined,
      brandId: brandId || undefined,
      categoryId: categoryId || undefined,
      lowStock: lowStock || undefined,
    })
      .then((data) => {
        setProducts(data.items);
        setTotalPages(data.totalPages);
      })
      .catch(() => setError('Failed to load parts'))
      .finally(() => setLoading(false));
  }, [page, search, brandId, categoryId, lowStock]);

  useEffect(() => {
    getBrands().then(setBrands).catch(() => {});
    getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setModalOpen(true);
  };

  const handleSubmit = async (form) => {
    const payload = {
      ...form,
      brandId: Number(form.brandId),
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      costPrice: Number(form.costPrice),
      sellingPrice: Number(form.sellingPrice),
      currentStock: form.currentStock !== '' ? Number(form.currentStock) : 0,
      reorderLevel: form.reorderLevel !== '' ? Number(form.reorderLevel) : 5,
    };

    if (editing) {
      await updateProduct(editing.id, payload);
      showToast('Part updated');
    } else {
      await createProduct(payload);
      showToast('Part created');
    }
    setModalOpen(false);
    loadProducts();
  };

  const handleDelete = async () => {
    await deleteProduct(deleteTarget.id);
    showToast('Part deleted');
    setDeleteTarget(null);
    loadProducts();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Package}
        title="Spare Parts"
        subtitle="Manage your vehicle parts inventory"
        action={isAdmin && (
          <Button onClick={openCreate}>
            <Plus size={16} /> Add Part
          </Button>
        )}
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            placeholder="Search by name or part number"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            className="rounded-md border border-zinc-700 bg-zinc-900 py-2 pl-8 pr-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
          />
        </div>
        <select
          value={brandId}
          onChange={(e) => { setPage(1); setBrandId(e.target.value); }}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
        >
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select
          value={categoryId}
          onChange={(e) => { setPage(1); setCategoryId(e.target.value); }}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            checked={lowStock}
            onChange={(e) => { setPage(1); setLowStock(e.target.checked); }}
            className="accent-amber-500"
          />
          Low stock only
        </label>
      </div>

      {error && <p className="text-red-400">{error}</p>}

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 shadow-sm">
        {loading ? (
          <Spinner label="Loading parts..." />
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-zinc-500">
                <th className="px-4 py-2 font-medium">Part #</th>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Brand</th>
                <th className="px-4 py-2 font-medium">Category</th>
                <th className="px-4 py-2 font-medium">Stock</th>
                <th className="px-4 py-2 font-medium">Selling Price</th>
                {isAdmin && <th className="px-4 py-2 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800/40">
                  <td className="px-4 py-2 text-zinc-500">{p.partNumber}</td>
                  <td className="px-4 py-2 text-zinc-100">{p.name}</td>
                  <td className="px-4 py-2 text-zinc-300">{p.brand.name}</td>
                  <td className="px-4 py-2 text-zinc-500">{p.category?.name || '-'}</td>
                  <td className="px-4 py-2 text-zinc-300">
                    {p.currentStock} {p.unit}
                    <LowStockBadge currentStock={p.currentStock} reorderLevel={p.reorderLevel} />
                  </td>
                  <td className="px-4 py-2 text-zinc-300">{formatCurrency(p.sellingPrice)}</td>
                  {isAdmin && (
                    <td className="px-4 py-2">
                      <button onClick={() => openEdit(p)} className="mr-3 text-amber-500 hover:underline">Edit</button>
                      <button onClick={() => setDeleteTarget(p)} className="text-red-400 hover:underline">Delete</button>
                    </td>
                  )}
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6}>
                    <EmptyState icon={Package} message="No parts found" />
                  </td>
                </tr>
              )}
            </tbody>
          </table></div>
        )}
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>

      <Modal open={modalOpen} title={editing ? 'Edit Part' : 'Add Part'} onClose={() => setModalOpen(false)}>
        <ProductForm
          brands={brands}
          categories={categories}
          initial={editing}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
