import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import Loading from '../../components/Loading';
import { useAppContext } from '../../context/useAppContext';
import toast from 'react-hot-toast';

import PromotionCenterHeader from '../../components/admin/coupons/PromotionCenterHeader';
import CouponKpiRow from '../../components/admin/coupons/CouponKpiRow';
import CreateCouponPanel from '../../components/admin/coupons/CreateCouponPanel';
import CouponFilterBar from '../../components/admin/coupons/CouponFilterBar';
import CouponRow from '../../components/admin/coupons/CouponRow';
import CouponEmptyState from '../../components/admin/coupons/CouponEmptyState';
import PremiumPagination from '../../components/admin/listshows/PremiumPagination';
import { getCouponStatus } from '../../lib/couponStatus';

const emptyForm = {
  code: '', type: 'percent', value: '', maxDiscount: '', minAmount: '',
  usageLimit: '', perUserLimit: '', priority: '', validFrom: '', expiryDate: '',
  theaterId: '', theme: 'sunset', mysteryShows: false, autoApply: false, isActive: true,
};

const DEFAULT_FILTERS = { query: '', status: 'all', type: 'all', date: '', sort: 'created-desc' };

const Coupons = () => {
  const { axios, getToken, user, fetchTheaters } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY;

  const [coupons, setCoupons] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const getAllCoupons = async (targetPage = page, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await axios.get('/api/coupon', {
        params: { page: targetPage, limit: pageSize },
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      setCoupons(data.coupons || []);
      setTotalPages(data.pageInfo?.totalPages || 1);
      setTotalCount(data.pageInfo?.total || data.coupons?.length || 0);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load coupons');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) getAllCoupons(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page, pageSize]);

  useEffect(() => {
    fetchTheaters().then(setTheaters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    getAllCoupons(page, true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.code || !form.value || !form.expiryDate || !form.usageLimit) {
      return toast.error('Please fill in code, value, expiry and usage limit');
    }
    setCreating(true);
    try {
      const { data } = await axios.post('/api/coupon', {
        code: form.code,
        type: form.type === 'bogo' || form.type === 'cashback' ? 'flat' : form.type,
        value: Number(form.value),
        expiryDate: new Date(form.expiryDate).toISOString(),
        usageLimit: Number(form.usageLimit),
        theaterId: form.theaterId || null,
      }, { headers: { Authorization: `Bearer ${await getToken()}` } });

      if (data.success) {
        toast.success('Coupon created');
        setForm(emptyForm);
        getAllCoupons(1);
        setPage(1);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to create coupon');
    }
    setCreating(false);
  };

  const togglePause = async (coupon) => {
    setSavingId(coupon._id);
    try {
      const { data } = await axios.put(`/api/coupon/${coupon._id}`,
        { isActive: !coupon.isActive },
        { headers: { Authorization: `Bearer ${await getToken()}` } });
      if (data.success) {
        toast.success(coupon.isActive ? 'Coupon paused' : 'Coupon reactivated');
        getAllCoupons(page, true);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update coupon');
    }
    setSavingId(null);
  };

  const handleEdit = (coupon) => {
    setForm({
      ...emptyForm,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      usageLimit: coupon.usageLimit,
      expiryDate: new Date(coupon.expiryDate).toISOString().slice(0, 10),
      theaterId: coupon.theaterId || '',
      isActive: coupon.isActive,
    });
    toast('Edit the fields below and create a new code, or adjust status inline', { icon: '✏️' });
  };

  const handleDuplicate = async (coupon) => {
    const newCode = `${coupon.code}-COPY`;
    try {
      const { data } = await axios.post('/api/coupon', {
        code: newCode,
        type: coupon.type,
        value: coupon.value,
        expiryDate: coupon.expiryDate,
        usageLimit: coupon.usageLimit,
        theaterId: coupon.theaterId || null,
      }, { headers: { Authorization: `Bearer ${await getToken()}` } });
      if (data.success) {
        toast.success(`Duplicated as ${newCode}`);
        getAllCoupons(page, true);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to duplicate coupon');
    }
  };

  const handleAnalytics = () => toast('Per-coupon analytics coming soon', { icon: '📊' });
  const handleDelete = (coupon) => toast(`Delete for ${coupon.code} — coming soon`, { icon: '🚧' });
  const handleExport = () => {
    const rows = [
      ['Code', 'Type', 'Value', 'Expiry', 'Used', 'Limit', 'Status'],
      ...filteredCoupons.map((c) => [c.code, c.type, c.value, new Date(c.expiryDate).toISOString(), c.usedCount, c.usageLimit, getCouponStatus(c)]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coupons-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const theaterNameById = useMemo(() => Object.fromEntries(theaters.map((t) => [t._id, t.name])), [theaters]);

  const filteredCoupons = useMemo(() => {
    let list = coupons.filter((c) => {
      if (filters.query && !c.code.toLowerCase().includes(filters.query.toLowerCase())) return false;
      if (filters.status !== 'all' && getCouponStatus(c) !== filters.status) return false;
      if (filters.type !== 'all' && c.type !== filters.type) return false;
      if (filters.date && new Date(c.expiryDate).toISOString().slice(0, 10) !== filters.date) return false;
      return true;
    });

    switch (filters.sort) {
      case 'created-asc': list = [...list].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
      case 'expiry-asc': list = [...list].sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)); break;
      case 'usage-desc': list = [...list].sort((a, b) => (b.usedCount / (b.usageLimit || 1)) - (a.usedCount / (a.usageLimit || 1))); break;
      default: list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return list;
  }, [coupons, filters]);

  const resetFilters = () => setFilters(DEFAULT_FILTERS);
  const scrollToForm = () => document.getElementById('create-coupon-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (loading) return <Loading />;

  return (
    <div className="space-y-5 pb-10">
      <PromotionCenterHeader onCreate={scrollToForm} onExport={handleExport} onRefresh={handleRefresh} refreshing={refreshing} />

      <CouponKpiRow coupons={coupons} currency={currency} />

      <div id="create-coupon-panel">
        <CreateCouponPanel form={form} setForm={setForm} theaters={theaters} onSubmit={handleCreate} creating={creating} />
      </div>

      <CouponFilterBar filters={filters} setFilters={setFilters} onReset={resetFilters} resultCount={filteredCoupons.length} />

      {filteredCoupons.length === 0 ? (
        <CouponEmptyState onCreate={scrollToForm} filtered={coupons.length > 0} onReset={resetFilters} />
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence mode="popLayout">
            {filteredCoupons.map((coupon, i) => (
              <CouponRow
                key={coupon._id}
                coupon={coupon}
                i={i}
                currency={currency}
                theaterName={coupon.theaterId ? theaterNameById[coupon.theaterId] : null}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onTogglePause={togglePause}
                onAnalytics={handleAnalytics}
                onDelete={handleDelete}
                savingId={savingId}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <PremiumPagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
        label="coupons"
      />
    </div>
  );
}

export default Coupons
