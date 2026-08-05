import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import Loading from '../../components/Loading';
import { useAppContext } from '../../context/useAppContext';
import toast from 'react-hot-toast';

import RevenuePricingHeader from '../../components/admin/pricing/RevenuePricingHeader';
import PricingKpiRow from '../../components/admin/pricing/PricingKpiRow';
import CreateRulePanel from '../../components/admin/pricing/CreateRulePanel';
import RuleFilterBar from '../../components/admin/pricing/RuleFilterBar';
import RuleRow from '../../components/admin/pricing/RuleRow';
import RuleEmptyState from '../../components/admin/pricing/RuleEmptyState';
import SimulationPanel from '../../components/admin/pricing/SimulationPanel';
import PremiumPagination from '../../components/admin/listshows/PremiumPagination';
import { getRuleStatus } from '../../lib/pricingRuleStatus';

const emptyForm = {
  name: '', type: 'time_of_week', adjustmentType: 'percentage', adjustmentPercent: '',
  daysOfWeek: [5, 6], startHour: '18', endHour: '24', minDaysBeforeShow: '7',
  theaterId: '', priority: '', seatCategories: false, conflictResolution: false, isActive: true,
};

const DEFAULT_FILTERS = { query: '', type: 'all', status: 'all', theater: 'all', sort: 'created-desc' };

const PricingRules = () => {
  const { axios, getToken, user, fetchTheaters } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY;

  const [rules, setRules] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [simulationOpen, setSimulationOpen] = useState(false);

  const getAllRules = async (targetPage = page, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await axios.get('/api/pricing-rule', {
        params: { page: targetPage, limit: pageSize },
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      setRules(data.rules || []);
      setTotalPages(data.pageInfo?.totalPages || 1);
      setTotalCount(data.pageInfo?.total || data.rules?.length || 0);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load pricing rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) getAllRules(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page, pageSize]);

  useEffect(() => {
    fetchTheaters().then(setTheaters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleDay = (day) => {
    setForm((f) => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(day) ? f.daysOfWeek.filter((d) => d !== day) : [...f.daysOfWeek, day].sort(),
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.adjustmentPercent) {
      return toast.error('Please fill in all required fields');
    }

    const payload = {
      name: form.name,
      type: form.type === 'time_of_week' || form.type === 'early_bird' ? form.type : 'time_of_week',
      adjustmentPercent: Number(form.adjustmentPercent),
      theaterId: form.theaterId || null,
    };
    if (payload.type === 'time_of_week') {
      if (form.daysOfWeek.length === 0) return toast.error('Select at least one day');
      payload.daysOfWeek = form.daysOfWeek;
      payload.startHour = Number(form.startHour);
      payload.endHour = Number(form.endHour);
    } else {
      payload.minDaysBeforeShow = Number(form.minDaysBeforeShow);
    }

    setCreating(true);
    try {
      const { data } = await axios.post('/api/pricing-rule', payload,
        { headers: { Authorization: `Bearer ${await getToken()}` } });

      if (data.success) {
        toast.success('Pricing rule created');
        setForm(emptyForm);
        getAllRules(1);
        setPage(1);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to create pricing rule');
    }
    setCreating(false);
  };

  const togglePause = async (rule) => {
    setSavingId(rule._id);
    try {
      const { data } = await axios.put(`/api/pricing-rule/${rule._id}`,
        { isActive: !rule.isActive },
        { headers: { Authorization: `Bearer ${await getToken()}` } });
      if (data.success) {
        toast.success(rule.isActive ? 'Rule paused' : 'Rule activated');
        getAllRules(page, true);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update rule');
    }
    setSavingId(null);
  };

  const handleDelete = async (rule) => {
    setSavingId(rule._id);
    try {
      const { data } = await axios.delete(`/api/pricing-rule/${rule._id}`,
        { headers: { Authorization: `Bearer ${await getToken()}` } });
      if (data.success) {
        toast.success('Rule deleted');
        getAllRules(page, true);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete rule');
    }
    setSavingId(null);
  };

  const handleEdit = (rule) => {
    setForm({
      ...emptyForm,
      name: rule.name,
      type: rule.type,
      adjustmentPercent: rule.adjustmentPercent,
      daysOfWeek: rule.daysOfWeek || [5, 6],
      startHour: rule.startHour ?? '18',
      endHour: rule.endHour ?? '24',
      minDaysBeforeShow: rule.minDaysBeforeShow ?? '7',
      theaterId: rule.theaterId || '',
      isActive: rule.isActive,
    });
    document.getElementById('create-rule-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast('Edit the fields below and create a new rule', { icon: '✏️' });
  };

  const handleDuplicate = async (rule) => {
    const payload = {
      name: `${rule.name} (Copy)`,
      type: rule.type,
      adjustmentPercent: rule.adjustmentPercent,
      theaterId: rule.theaterId || null,
    };
    if (rule.type === 'time_of_week') {
      payload.daysOfWeek = rule.daysOfWeek;
      payload.startHour = rule.startHour;
      payload.endHour = rule.endHour;
    } else {
      payload.minDaysBeforeShow = rule.minDaysBeforeShow;
    }
    try {
      const { data } = await axios.post('/api/pricing-rule', payload,
        { headers: { Authorization: `Bearer ${await getToken()}` } });
      if (data.success) {
        toast.success('Rule duplicated');
        getAllRules(page, true);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to duplicate rule');
    }
  };

  const handleAnalytics = () => toast('Per-rule analytics coming soon', { icon: '📊' });
  const handleImport = () => toast('Bulk import coming soon', { icon: '🚧' });
  const handleHistory = () => toast('Full change history coming soon', { icon: '🚧' });
  const handleExport = () => {
    const rows = [
      ['Name', 'Type', 'Adjustment %', 'Theater', 'Status', 'Created'],
      ...filteredRules.map((r) => [r.name, r.type, r.adjustmentPercent, r.theaterId || 'Global', getRuleStatus(r), new Date(r.createdAt).toISOString()]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pricing-rules-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const theaterNameById = useMemo(() => Object.fromEntries(theaters.map((t) => [t._id, t.name])), [theaters]);

  const filteredRules = useMemo(() => {
    let list = rules.filter((r) => {
      if (filters.query && !r.name.toLowerCase().includes(filters.query.toLowerCase())) return false;
      if (filters.type !== 'all' && r.type !== filters.type) return false;
      if (filters.status !== 'all' && getRuleStatus(r) !== filters.status) return false;
      if (filters.theater !== 'all' && (r.theaterId || '') !== filters.theater) return false;
      return true;
    });

    switch (filters.sort) {
      case 'created-asc': list = [...list].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
      case 'adjustment-desc': list = [...list].sort((a, b) => b.adjustmentPercent - a.adjustmentPercent); break;
      case 'adjustment-asc': list = [...list].sort((a, b) => a.adjustmentPercent - b.adjustmentPercent); break;
      default: list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return list;
  }, [rules, filters]);

  const resetFilters = () => setFilters(DEFAULT_FILTERS);
  const scrollToForm = () => document.getElementById('create-rule-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (loading) return <Loading />;

  return (
    <div className="space-y-5 pb-10">
      <RevenuePricingHeader
        onCreate={scrollToForm}
        onImport={handleImport}
        onExport={handleExport}
        onSimulate={() => setSimulationOpen(true)}
        onHistory={handleHistory}
      />

      <PricingKpiRow rules={rules} currency={currency} />

      <div id="create-rule-panel">
        <CreateRulePanel
          form={form}
          setForm={setForm}
          theaters={theaters}
          onToggleDay={toggleDay}
          onSubmit={handleCreate}
          creating={creating}
          currency={currency}
        />
      </div>

      <RuleFilterBar filters={filters} setFilters={setFilters} theaters={theaters} onReset={resetFilters} resultCount={filteredRules.length} />

      {filteredRules.length === 0 ? (
        <RuleEmptyState onCreate={scrollToForm} filtered={rules.length > 0} onReset={resetFilters} />
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence mode="popLayout">
            {filteredRules.map((rule, i) => (
              <RuleRow
                key={rule._id}
                rule={rule}
                i={i}
                currency={currency}
                theaterName={rule.theaterId ? theaterNameById[rule.theaterId] : null}
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
        label="rules"
      />

      <SimulationPanel
        open={simulationOpen}
        onClose={() => setSimulationOpen(false)}
        rules={rules}
        theaters={theaters}
        currency={currency}
      />
    </div>
  );
}

export default PricingRules
