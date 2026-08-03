import React, { useEffect, useState } from 'react'
import Loading from '../../components/Loading';
import Title from '../../components/admin/Title';
import PaginationControls from '../../components/admin/PaginationControls';
import Select from '../../components/admin/Select';
import { useAppContext } from '../../context/useAppContext';
import { ADMIN_INPUT_CLASS, ADMIN_SUBMIT_BTN_CLASS } from '../../lib/adminStyles';
import toast from 'react-hot-toast';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const emptyForm = {
  name: '',
  type: 'time_of_week',
  adjustmentPercent: '',
  daysOfWeek: [5, 6],
  startHour: '18',
  endHour: '24',
  minDaysBeforeShow: '7',
};

const PricingRules = () => {

  const {axios , getToken , user} = useAppContext();

  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const getAllRules = async (targetPage = page) => {
    try {
      const {data} = await axios.get('/api/pricing-rule', {
        params: { page: targetPage },
        headers: {Authorization: `Bearer ${await getToken()}`},
      });
      setRules(data.rules);
      setTotalPages(data.pageInfo?.totalPages || 1);
      setLoading(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load pricing rules');
      setLoading(false);
    }
  }

  useEffect(() => {
    if(user){
      getAllRules(page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[user, page]);

  const toggleDay = (day) => {
    setForm(f => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(day)
        ? f.daysOfWeek.filter(d => d !== day)
        : [...f.daysOfWeek, day].sort(),
    }));
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.adjustmentPercent) {
      return toast.error('Please fill in all required fields');
    }

    const payload = {
      name: form.name,
      type: form.type,
      adjustmentPercent: Number(form.adjustmentPercent),
    };
    if (form.type === 'time_of_week') {
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
  }

  const toggleActive = async (rule) => {
    setSavingId(rule._id);
    try {
      const { data } = await axios.put(`/api/pricing-rule/${rule._id}`,
        { isActive: !rule.isActive },
        { headers: { Authorization: `Bearer ${await getToken()}` } });
      if (data.success) {
        toast.success(rule.isActive ? 'Rule deactivated' : 'Rule reactivated');
        getAllRules();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update rule');
    }
    setSavingId(null);
  }

  const handleDelete = async (ruleId) => {
    setSavingId(ruleId);
    try {
      const { data } = await axios.delete(`/api/pricing-rule/${ruleId}`,
        { headers: { Authorization: `Bearer ${await getToken()}` } });
      if (data.success) {
        toast.success('Rule deleted');
        getAllRules();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete rule');
    }
    setSavingId(null);
  }

  const describeRule = (rule) => {
    if (rule.type === 'time_of_week') {
      return `${rule.daysOfWeek.map(d => DAY_LABELS[d]).join(', ')}, ${rule.startHour}:00–${rule.endHour}:00`;
    }
    return `Booked ≥ ${rule.minDaysBeforeShow} days before showtime`;
  }

  return !loading ? (
    <>
      <Title text1="Manage" text2="Pricing Rules"/>

      <form onSubmit={handleCreate} className='mt-6 max-w-3xl flex flex-wrap gap-3 items-end'>
        <div className='flex flex-col gap-1'>
          <label className='text-xs text-gray-400'>Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm(f => ({...f, name: e.target.value}))}
            className={`${ADMIN_INPUT_CLASS} w-40`}
            placeholder="Weekend evening surcharge"
          />
        </div>
        <div className='flex flex-col gap-1'>
          <label className='text-xs text-gray-400'>Type</label>
          <Select
            value={form.type}
            onChange={(e) => setForm(f => ({...f, type: e.target.value}))}
            options={[
              { value: 'time_of_week', label: 'Time-of-week surcharge' },
              { value: 'early_bird', label: 'Early-bird discount' },
            ]}
          />
        </div>
        <div className='flex flex-col gap-1'>
          <label className='text-xs text-gray-400'>Adjustment %</label>
          <input
            type="number"
            value={form.adjustmentPercent}
            onChange={(e) => setForm(f => ({...f, adjustmentPercent: e.target.value}))}
            className={`${ADMIN_INPUT_CLASS} w-24`}
            placeholder="e.g. 20 or -10"
          />
        </div>

        {form.type === 'time_of_week' ? (
          <>
            <div className='flex flex-col gap-1'>
              <label className='text-xs text-gray-400'>Days</label>
              <div className='flex gap-1'>
                {DAY_LABELS.map((label, day) => (
                  <button
                    type="button"
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`px-2 py-1.5 text-xs rounded border cursor-pointer ${form.daysOfWeek.includes(day) ? 'bg-primary border-primary' : 'border-primary/30'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-xs text-gray-400'>Start hour</label>
              <input
                type="number" min="0" max="23"
                value={form.startHour}
                onChange={(e) => setForm(f => ({...f, startHour: e.target.value}))}
                className={`${ADMIN_INPUT_CLASS} w-20`}
              />
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-xs text-gray-400'>End hour</label>
              <input
                type="number" min="1" max="24"
                value={form.endHour}
                onChange={(e) => setForm(f => ({...f, endHour: e.target.value}))}
                className={`${ADMIN_INPUT_CLASS} w-20`}
              />
            </div>
          </>
        ) : (
          <div className='flex flex-col gap-1'>
            <label className='text-xs text-gray-400'>Min days before show</label>
            <input
              type="number" min="0"
              value={form.minDaysBeforeShow}
              onChange={(e) => setForm(f => ({...f, minDaysBeforeShow: e.target.value}))}
              className={`${ADMIN_INPUT_CLASS} w-24`}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={creating}
          className={ADMIN_SUBMIT_BTN_CLASS}
        >
          {creating ? 'Creating...' : 'Create'}
        </button>
      </form>

      <div className='max-w-4xl mt-8 overflow-x-auto'>
        <table className='w-full border-collapse rounded-md overflow-hidden text-nowrap'>
          <thead>
            <tr className='bg-primary/20 text-left text-white'>
              <th className='p-2 font-medium pl-5'>Name</th>
              <th className='p-2 font-medium'>Type</th>
              <th className='p-2 font-medium'>Rule</th>
              <th className='p-2 font-medium'>Adjustment</th>
              <th className='p-2 font-medium'>Scope</th>
              <th className='p-2 font-medium'>Status</th>
              <th className='p-2 font-medium'>Actions</th>
            </tr>
          </thead>

          <tbody className='text-sm font-light'>
            {rules.map((rule) => (
              <tr key={rule._id} className='border-b border-primary/20 bg-primary/5 even:bg-primary/10'>
                <td className='p-2 min-w-32 pl-5 font-medium'>{rule.name}</td>
                <td className='p-2 capitalize'>{rule.type.replace(/_/g, ' ')}</td>
                <td className='p-2'>{describeRule(rule)}</td>
                <td className={`p-2 ${rule.adjustmentPercent > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                  {rule.adjustmentPercent > 0 ? '+' : ''}{rule.adjustmentPercent}%
                </td>
                <td className='p-2'>{rule.theaterId ? 'This theater' : 'Global'}</td>
                <td className='p-2'>
                  {rule.isActive ? (
                    <span className='text-green-500 text-xs'>Active</span>
                  ) : (
                    <span className='text-red-500 text-xs'>Inactive</span>
                  )}
                </td>
                <td className='p-2'>
                  <div className='flex gap-2'>
                    <button
                      onClick={() => toggleActive(rule)}
                      disabled={savingId === rule._id}
                      className='text-primary text-xs font-medium cursor-pointer disabled:opacity-50'
                    >
                      {rule.isActive ? 'Deactivate' : 'Reactivate'}
                    </button>
                    <button
                      onClick={() => handleDelete(rule._id)}
                      disabled={savingId === rule._id}
                      className='text-red-500 text-xs font-medium cursor-pointer disabled:opacity-50'
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
    </>
  ) : <Loading />;
}

export default PricingRules
