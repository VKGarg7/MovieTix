import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import SuperAdminGate from '../../components/admin/SuperAdminGate';
import { useAppContext } from '../../context/useAppContext';
import useFetchOnUser from '../../hooks/useFetchOnUser';
import usePolling from '../../hooks/usePolling';
import { defaultDateRange } from '../../lib/dateRange';
import toast from 'react-hot-toast';

import ActivityCenterHeader from '../../components/admin/auditlog/ActivityCenterHeader';
import ActivityKpiRow from '../../components/admin/auditlog/ActivityKpiRow';
import ActivityFilterBar from '../../components/admin/auditlog/ActivityFilterBar';
import ActivityTableHeader from '../../components/admin/auditlog/ActivityTableHeader';
import ActivityTableRow from '../../components/admin/auditlog/ActivityTableRow';
import ActivityTimeline from '../../components/admin/auditlog/ActivityTimeline';
import ActivitySkeleton from '../../components/admin/auditlog/ActivitySkeleton';
import ActivityEmptyState from '../../components/admin/auditlog/ActivityEmptyState';
import DiffDrawer from '../../components/admin/auditlog/DiffDrawer';
import PremiumPagination from '../../components/admin/listshows/PremiumPagination';
import { matchesSearch, getEntitySummary, getActionMeta } from '../../lib/auditSummary';

const POLL_INTERVAL_MS = 30000;

const AuditLogInner = () => {
  const { axios, user } = useAppContext();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [now, setNow] = useState(Date.now());

  const [actorId, setActorId] = useState('');
  const [entityType, setEntityType] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [range, setRange] = useState(defaultDateRange);
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const fetchAuditLog = async (targetPage = page, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await axios.get('/api/admin/audit-log', {
        params: {
          page: targetPage,
          limit: pageSize,
          ...(actorId ? { actorId } : {}),
          ...(entityType ? { entityType } : {}),
          ...(range.from ? { from: range.from } : {}),
          ...(range.to ? { to: range.to } : {}),
        },
      });

      if (data.success) {
        setEntries(data.entries);
        setTotalPages(data.pageInfo?.totalPages || 1);
        setTotalCount(data.pageInfo?.total || data.entries.length);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load audit log');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFetchOnUser(user, () => fetchAuditLog(page), [page, pageSize, actorId, entityType, range.from, range.to]);

  usePolling(
    (isCancelled) => { if (!isCancelled()) fetchAuditLog(page, true); },
    POLL_INTERVAL_MS,
    { enabled: Boolean(user) && autoRefresh, deps: [user, page, pageSize, actorId, entityType, range.from, range.to, autoRefresh] }
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAuditLog(page, true);
  };

  const updateActorId = (value) => { setActorId(value); setPage(1); };
  const updateEntityType = (value) => { setEntityType(value); setPage(1); };
  const updateRange = (value) => { setRange(value); setPage(1); };

  const resetFilters = () => {
    setActorId('');
    setEntityType('');
    setActionFilter('all');
    setRange(defaultDateRange());
    setQuery('');
    setPage(1);
  };

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (actionFilter !== 'all' && e.action !== actionFilter) return false;
      if (!matchesSearch(e, query)) return false;
      return true;
    });
  }, [entries, actionFilter, query]);

  const handleExport = () => {
    const rows = [
      ['Time', 'Actor', 'Role', 'Action', 'Entity Type', 'Entity ID', 'Summary'],
      ...filteredEntries.map((e) => [
        new Date(e.createdAt).toISOString(),
        e.actorName || e.actorId,
        e.actorRole,
        getActionMeta(e.action).label,
        e.entityType,
        e.entityId,
        getEntitySummary(e),
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  return (
    <div className="space-y-5 pb-10">
      <ActivityCenterHeader
        onExport={handleExport}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={() => setAutoRefresh((v) => !v)}
      />

      <ActivityKpiRow entries={entries} />

      <ActivityFilterBar
        actorId={actorId}
        setActorId={updateActorId}
        entityType={entityType}
        setEntityType={updateEntityType}
        actionFilter={actionFilter}
        setActionFilter={setActionFilter}
        range={range}
        setRange={updateRange}
        query={query}
        setQuery={setQuery}
        onReset={resetFilters}
        resultCount={filteredEntries.length}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {loading ? (
        <ActivitySkeleton />
      ) : filteredEntries.length === 0 ? (
        <ActivityEmptyState filtered={entries.length > 0} onReset={resetFilters} />
      ) : viewMode === 'table' ? (
        <div className="space-y-1.5">
          <ActivityTableHeader />
          <AnimatePresence mode="popLayout">
            {filteredEntries.map((entry, i) => (
              <ActivityTableRow key={entry._id} entry={entry} i={i} now={now} onViewDetails={setSelectedEntry} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="glass-panel !rounded-3xl p-5">
          <ActivityTimeline entries={filteredEntries} onViewDetails={setSelectedEntry} />
        </div>
      )}

      <PremiumPagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
        label="events"
      />

      <DiffDrawer entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
    </div>
  );
};

const AuditLog = () => {
  const { adminRole } = useAppContext();
  return (
    <SuperAdminGate
      adminRole={adminRole}
      text1="Audit"
      text2="Log"
      message="Only super-admins can view the audit log."
    >
      <AuditLogInner />
    </SuperAdminGate>
  );
};

export default AuditLog;
