import React, { useEffect, useState } from 'react'
import Loading from '../../components/Loading';
import Title from '../../components/admin/Title';
import PaginationControls from '../../components/admin/PaginationControls';
import Select from '../../components/admin/Select';
import { useAppContext } from '../../context/useAppContext';
import { ADMIN_INPUT_CLASS, ADMIN_SUBMIT_BTN_CLASS } from '../../lib/adminStyles';
import toast from 'react-hot-toast';

const emptyForm = { code: '', type: 'flat', value: '', expiryDate: '', usageLimit: '' };

const Coupons = () => {

  const {axios , getToken , user} = useAppContext();

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const getAllCoupons = async (targetPage = page) => {
    try {
      const {data} = await axios.get('/api/coupon', {
        params: { page: targetPage },
        headers: {Authorization: `Bearer ${await getToken()}`},
      });
      setCoupons(data.coupons);
      setTotalPages(data.pageInfo?.totalPages || 1);
      setLoading(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load coupons');
      setLoading(false);
    }
  }

  useEffect(() => {
    if(user){
      getAllCoupons(page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[user, page]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.code || !form.value || !form.expiryDate || !form.usageLimit) {
      return toast.error('Please fill in all fields');
    }
    setCreating(true);
    try {
      const { data } = await axios.post('/api/coupon', {
        code: form.code,
        type: form.type,
        value: Number(form.value),
        expiryDate: new Date(form.expiryDate).toISOString(),
        usageLimit: Number(form.usageLimit),
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
  }

  const toggleActive = async (coupon) => {
    setSavingId(coupon._id);
    try {
      const { data } = await axios.put(`/api/coupon/${coupon._id}`,
        { isActive: !coupon.isActive },
        { headers: { Authorization: `Bearer ${await getToken()}` } });
      if (data.success) {
        toast.success(coupon.isActive ? 'Coupon deactivated' : 'Coupon reactivated');
        getAllCoupons();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update coupon');
    }
    setSavingId(null);
  }

  return !loading ? (
    <>
      <Title text1="Manage" text2="Coupons"/>

      <form onSubmit={handleCreate} className='mt-6 max-w-3xl flex flex-wrap gap-3 items-end'>
        <div className='flex flex-col gap-1'>
          <label className='text-xs text-gray-400'>Code</label>
          <input
            type="text"
            value={form.code}
            onChange={(e) => setForm(f => ({...f, code: e.target.value.toUpperCase()}))}
            className={`${ADMIN_INPUT_CLASS} w-32`}
            placeholder="SAVE20"
          />
        </div>
        <div className='flex flex-col gap-1'>
          <label className='text-xs text-gray-400'>Type</label>
          <Select
            value={form.type}
            onChange={(e) => setForm(f => ({...f, type: e.target.value}))}
            options={[{ value: 'flat', label: 'Flat' }, { value: 'percent', label: 'Percent' }]}
          />
        </div>
        <div className='flex flex-col gap-1'>
          <label className='text-xs text-gray-400'>Value</label>
          <input
            type="number"
            value={form.value}
            onChange={(e) => setForm(f => ({...f, value: e.target.value}))}
            className={`${ADMIN_INPUT_CLASS} w-24`}
          />
        </div>
        <div className='flex flex-col gap-1'>
          <label className='text-xs text-gray-400'>Expiry</label>
          <input
            type="date"
            value={form.expiryDate}
            onChange={(e) => setForm(f => ({...f, expiryDate: e.target.value}))}
            className={ADMIN_INPUT_CLASS}
          />
        </div>
        <div className='flex flex-col gap-1'>
          <label className='text-xs text-gray-400'>Usage limit</label>
          <input
            type="number"
            value={form.usageLimit}
            onChange={(e) => setForm(f => ({...f, usageLimit: e.target.value}))}
            className={`${ADMIN_INPUT_CLASS} w-24`}
          />
        </div>
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
              <th className='p-2 font-medium pl-5'>Code</th>
              <th className='p-2 font-medium'>Type</th>
              <th className='p-2 font-medium'>Value</th>
              <th className='p-2 font-medium'>Expiry</th>
              <th className='p-2 font-medium'>Used / Limit</th>
              <th className='p-2 font-medium'>Status</th>
              <th className='p-2 font-medium'>Actions</th>
            </tr>
          </thead>

          <tbody className='text-sm font-light'>
            {coupons.map((coupon) => (
              <tr key={coupon._id} className='border-b border-primary/20 bg-primary/5 even:bg-primary/10'>
                <td className='p-2 min-w-32 pl-5 font-medium'>{coupon.code}</td>
                <td className='p-2 capitalize'>{coupon.type}</td>
                <td className='p-2'>{coupon.type === 'percent' ? `${coupon.value}%` : coupon.value}</td>
                <td className='p-2'>{new Date(coupon.expiryDate).toLocaleDateString()}</td>
                <td className='p-2'>{coupon.usedCount} / {coupon.usageLimit}</td>
                <td className='p-2'>
                  {coupon.isActive ? (
                    <span className='text-green-500 text-xs'>Active</span>
                  ) : (
                    <span className='text-red-500 text-xs'>Inactive</span>
                  )}
                </td>
                <td className='p-2'>
                  <button
                    onClick={() => toggleActive(coupon)}
                    disabled={savingId === coupon._id}
                    className='text-primary text-xs font-medium cursor-pointer disabled:opacity-50'
                  >
                    {coupon.isActive ? 'Deactivate' : 'Reactivate'}
                  </button>
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

export default Coupons
