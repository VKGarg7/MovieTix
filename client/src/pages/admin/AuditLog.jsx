import React, { useState } from 'react';
import Title from '../../components/admin/Title';
import Select from '../../components/admin/Select';
import DateRangePicker from '../../components/admin/DateRangePicker';
import PaginationControls from '../../components/admin/PaginationControls';
import InlineSpinner from '../../components/admin/InlineSpinner';
import SuperAdminGate from '../../components/admin/SuperAdminGate';
import { ADMIN_INPUT_CLASS } from '../../lib/adminStyles';
import { useAppContext } from '../../context/useAppContext';
import useFetchOnUser from '../../hooks/useFetchOnUser';
import { defaultDateRange } from '../../lib/dateRange';
import toast from 'react-hot-toast';

const ENTITY_TYPE_OPTIONS = [
  { value: '', label: 'All entity types' },
  { value: 'Show', label: 'Show' },
  { value: 'Theater', label: 'Theater' },
  { value: 'Screen', label: 'Screen' },
];

const ACTION_LABEL = { create: 'Created', update: 'Updated', delete: 'Deleted' };

const formatTimestamp = (value) => new Date(value).toLocaleString();

const AuditLog = () => {
  const { axios, user, adminRole } = useAppContext();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [actorId, setActorId] = useState('');
  const [entityType, setEntityType] = useState('');
  const [range, setRange] = useState(defaultDateRange);

  const fetchAuditLog = async (targetPage = page) => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/admin/audit-log', {
        params: {
          page: targetPage,
          ...(actorId ? { actorId } : {}),
          ...(entityType ? { entityType } : {}),
          ...(range.from ? { from: range.from } : {}),
          ...(range.to ? { to: range.to } : {}),
        },
      });

      if (data.success) {
        setEntries(data.entries);
        setTotalPages(data.pageInfo?.totalPages || 1);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load audit log');
    }
    setLoading(false);
  };

  useFetchOnUser(
    adminRole === 'superAdmin' ? user : null,
    () => fetchAuditLog(page),
    [page, actorId, entityType, range.from, range.to]
  );

  const updateActorId = (value) => { setActorId(value); setPage(1); };
  const updateEntityType = (value) => { setEntityType(value); setPage(1); };
  const updateRange = (value) => { setRange(value); setPage(1); };

  return (
    <SuperAdminGate
      adminRole={adminRole}
      text1="Audit"
      text2="Log"
      message="Only super-admins can view the audit log."
    >
      <Title text1="Audit" text2="Log" />

      <div className="flex flex-wrap items-end gap-3 mt-6">
        <label className="flex flex-col text-sm text-gray-400 gap-1">
          Actor ID
          <input
            className={ADMIN_INPUT_CLASS}
            placeholder="Clerk user id"
            value={actorId}
            onChange={(e) => updateActorId(e.target.value)}
          />
        </label>

        <label className="flex flex-col text-sm text-gray-400 gap-1">
          Entity type
          <Select
            value={entityType}
            onChange={(e) => updateEntityType(e.target.value)}
            options={ENTITY_TYPE_OPTIONS}
          />
        </label>

        <DateRangePicker
          from={range.from}
          to={range.to}
          onChange={updateRange}
        />
      </div>

      {loading ? (
        <InlineSpinner className="h-40 mt-6" />
      ) : entries.length === 0 ? (
        <p className="text-gray-400 mt-6">No audit log entries match these filters.</p>
      ) : (
        <div className="max-w-5xl mt-6 overflow-x-auto">
          <table className="w-full border-collapse rounded-md overflow-hidden text-nowrap">
            <thead>
              <tr className="bg-primary/20 text-left text-white">
                <th className="p-2 font-medium pl-5">Timestamp</th>
                <th className="p-2 font-medium">Actor</th>
                <th className="p-2 font-medium">Action</th>
                <th className="p-2 font-medium">Entity</th>
                <th className="p-2 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="text-sm font-light">
              {entries.map((entry) => (
                <tr key={entry._id} className="border-b border-primary/20 bg-primary/5 even:bg-primary/10">
                  <td className="p-2 pl-5">{formatTimestamp(entry.createdAt)}</td>
                  <td className="p-2">
                    {entry.actorId}
                    <span className="text-gray-400"> ({entry.actorRole})</span>
                  </td>
                  <td className="p-2">{ACTION_LABEL[entry.action] || entry.action}</td>
                  <td className="p-2">
                    {entry.entityType}
                    <span className="text-gray-400"> #{entry.entityId.slice(-6)}</span>
                  </td>
                  <td className="p-2 max-w-96 text-wrap text-gray-400">
                    {JSON.stringify(entry.diff)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
    </SuperAdminGate>
  );
};

export default AuditLog;
