import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Loading from '../../components/Loading';
import { useAppContext } from '../../context/useAppContext';
import toast from 'react-hot-toast';

import ConcessionsHeader from '../../components/admin/menu/ConcessionsHeader';
import MenuKpiRow from '../../components/admin/menu/MenuKpiRow';
import CreateItemPanel from '../../components/admin/menu/CreateItemPanel';
import MenuAIInsights from '../../components/admin/menu/MenuAIInsights';
import TopSellersCarousel from '../../components/admin/menu/TopSellersCarousel';
import MenuFilterBar from '../../components/admin/menu/MenuFilterBar';
import MenuItemCard from '../../components/admin/menu/MenuItemCard';
import MenuEmptyState from '../../components/admin/menu/MenuEmptyState';
import PaginationShell from '../../components/admin/PaginationShell';
import { guessCategory, getStockStatus } from '../../lib/menuItemStatus';
import { downloadCsvRows } from '../../lib/downloadCsv';

const emptyForm = {
  name: '', category: 'snacks', price: '', description: '', imageUrl: '',
  size: '', theaterId: '', prepTime: '', calories: '', taxCategory: 'standard',
  isAvailable: true, isFeatured: false,
};

const DEFAULT_FILTERS = { query: '', category: 'all', status: 'all', theater: 'all', minPrice: '', maxPrice: '', sort: 'created-desc' };

const MenuItems = () => {
  const { axios, getToken, user, fetchTheaters } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY;

  const [items, setItems] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const getAllItems = async (targetPage = page, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await axios.get('/api/menu/admin', {
        params: { page: targetPage, limit: pageSize },
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      setItems(data.items || []);
      setTotalPages(data.pageInfo?.totalPages || 1);
      setTotalCount(data.pageInfo?.total || data.items?.length || 0);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      getAllItems(page);
      fetchTheaters().then(setTheaters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page, pageSize]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      return toast.error('Please fill in name and price');
    }

    setCreating(true);
    try {
      const { data } = await axios.post('/api/menu/admin', {
        name: form.name,
        price: Number(form.price),
        imageUrl: form.imageUrl,
        theaterId: form.theaterId || undefined,
      }, { headers: { Authorization: `Bearer ${await getToken()}` } });

      if (data.success) {
        toast.success('Menu item created');
        setForm(emptyForm);
        getAllItems(1);
        setPage(1);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to create menu item');
    }
    setCreating(false);
  };

  const toggleAvailable = async (item) => {
    setSavingId(item._id);
    try {
      const { data } = await axios.put(`/api/menu/admin/${item._id}`,
        { isAvailable: !item.isAvailable },
        { headers: { Authorization: `Bearer ${await getToken()}` } });
      if (data.success) {
        toast.success(item.isAvailable ? 'Marked unavailable' : 'Marked available');
        getAllItems(page, true);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update item');
    }
    setSavingId(null);
  };

  const handleDelete = async (item) => {
    setSavingId(item._id);
    try {
      const { data } = await axios.delete(`/api/menu/admin/${item._id}`,
        { headers: { Authorization: `Bearer ${await getToken()}` } });
      if (data.success) {
        toast.success('Menu item deleted');
        getAllItems(page, true);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete item');
    }
    setSavingId(null);
  };

  const handleEdit = (item) => {
    setForm({
      ...emptyForm,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
      theaterId: item.theaterId || '',
      isAvailable: item.isAvailable,
      category: guessCategory(item.name),
    });
    document.getElementById('create-item-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast('Edit the fields below and create a new item', { icon: '✏️' });
  };

  const handleDuplicate = async (item) => {
    try {
      const { data } = await axios.post('/api/menu/admin', {
        name: `${item.name} (Copy)`,
        price: item.price,
        imageUrl: item.imageUrl,
        theaterId: item.theaterId || undefined,
      }, { headers: { Authorization: `Bearer ${await getToken()}` } });
      if (data.success) {
        toast.success('Item duplicated');
        getAllItems(page, true);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to duplicate item');
    }
  };

  const handleImport = () => toast('Bulk menu import coming soon', { icon: '🚧' });
  const handleExport = () => {
    const rows = [
      ['Name', 'Price', 'Status', 'Theater'],
      ...filteredItems.map((i) => [i.name, i.price, i.isAvailable ? 'Available' : 'Unavailable', i.theaterId || '']),
    ];
    downloadCsvRows(rows, `menu-items-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('CSV exported');
  };

  const filteredItems = useMemo(() => {
    let list = items.filter((item) => {
      if (filters.query && !item.name.toLowerCase().includes(filters.query.toLowerCase())) return false;
      if (filters.category !== 'all' && guessCategory(item.name) !== filters.category) return false;
      if (filters.status !== 'all' && getStockStatus(item) !== filters.status) return false;
      if (filters.theater !== 'all' && (item.theaterId || '') !== filters.theater) return false;
      if (filters.minPrice && item.price < Number(filters.minPrice)) return false;
      if (filters.maxPrice && item.price > Number(filters.maxPrice)) return false;
      return true;
    });

    switch (filters.sort) {
      case 'price-desc': list = [...list].sort((a, b) => b.price - a.price); break;
      case 'price-asc': list = [...list].sort((a, b) => a.price - b.price); break;
      case 'name-asc': list = [...list].sort((a, b) => a.name.localeCompare(b.name)); break;
      default: list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return list;
  }, [items, filters]);

  const resetFilters = () => setFilters(DEFAULT_FILTERS);
  const scrollToForm = () => document.getElementById('create-item-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (loading) return <Loading />;

  return (
    <div className="space-y-5 pb-10">
      <ConcessionsHeader onAdd={scrollToForm} onImport={handleImport} onExport={handleExport} />

      <MenuKpiRow items={items} currency={currency} />

      <div id="create-item-panel">
        <CreateItemPanel form={form} setForm={setForm} theaters={theaters} onSubmit={handleCreate} creating={creating} currency={currency} />
      </div>

      <TopSellersCarousel items={items} currency={currency} />

      <MenuFilterBar filters={filters} setFilters={setFilters} theaters={theaters} onReset={resetFilters} resultCount={filteredItems.length} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">
        {filteredItems.length === 0 ? (
          <MenuEmptyState onAdd={scrollToForm} filtered={items.length > 0} onReset={resetFilters} />
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, i) => (
                <MenuItemCard
                  key={item._id}
                  item={item}
                  i={i}
                  currency={currency}
                  onToggleAvailable={toggleAvailable}
                  onEdit={handleEdit}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                  savingId={savingId}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        <MenuAIInsights items={items} />
      </div>

      <PaginationShell
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
        label="items"
      />
    </div>
  );
}

export default MenuItems
