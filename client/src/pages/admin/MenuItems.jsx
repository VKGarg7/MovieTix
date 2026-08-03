import React, { useEffect, useState } from 'react'
import Loading from '../../components/Loading';
import Title from '../../components/admin/Title';
import PaginationControls from '../../components/admin/PaginationControls';
import Select from '../../components/admin/Select';
import { useAppContext } from '../../context/useAppContext';
import { ADMIN_INPUT_CLASS, ADMIN_SUBMIT_BTN_CLASS } from '../../lib/adminStyles';
import toast from 'react-hot-toast';

const emptyForm = { name: '', price: '', imageUrl: '', theaterId: '' };

const MenuItems = () => {

  const {axios , getToken , user , fetchTheaters} = useAppContext();

  const [items, setItems] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const currency = import.meta.env.VITE_CURRENCY;

  const getAllItems = async (targetPage = page) => {
    try {
      const {data} = await axios.get('/api/menu/admin', {
        params: { page: targetPage },
        headers: {Authorization: `Bearer ${await getToken()}`},
      });
      setItems(data.items);
      setTotalPages(data.pageInfo?.totalPages || 1);
      setLoading(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load menu items');
      setLoading(false);
    }
  }

  useEffect(() => {
    if(user){
      getAllItems(page);
      fetchTheaters().then(setTheaters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[user, page]);

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
  }

  const toggleAvailable = async (item) => {
    setSavingId(item._id);
    try {
      const { data } = await axios.put(`/api/menu/admin/${item._id}`,
        { isAvailable: !item.isAvailable },
        { headers: { Authorization: `Bearer ${await getToken()}` } });
      if (data.success) {
        toast.success(item.isAvailable ? 'Marked unavailable' : 'Marked available');
        getAllItems();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update item');
    }
    setSavingId(null);
  }

  const handleDelete = async (itemId) => {
    setSavingId(itemId);
    try {
      const { data } = await axios.delete(`/api/menu/admin/${itemId}`,
        { headers: { Authorization: `Bearer ${await getToken()}` } });
      if (data.success) {
        toast.success('Menu item deleted');
        getAllItems();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete item');
    }
    setSavingId(null);
  }

  return !loading ? (
    <>
      <Title text1="Manage" text2="Menu Items"/>

      <form onSubmit={handleCreate} className='mt-6 max-w-3xl flex flex-wrap gap-3 items-end'>
        <div className='flex flex-col gap-1'>
          <label className='text-xs text-gray-400'>Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm(f => ({...f, name: e.target.value}))}
            className={`${ADMIN_INPUT_CLASS} w-40`}
            placeholder="Popcorn (Large)"
          />
        </div>
        <div className='flex flex-col gap-1'>
          <label className='text-xs text-gray-400'>Price</label>
          <input
            type="number"
            value={form.price}
            onChange={(e) => setForm(f => ({...f, price: e.target.value}))}
            className={`${ADMIN_INPUT_CLASS} w-24`}
          />
        </div>
        <div className='flex flex-col gap-1'>
          <label className='text-xs text-gray-400'>Image URL</label>
          <input
            type="text"
            value={form.imageUrl}
            onChange={(e) => setForm(f => ({...f, imageUrl: e.target.value}))}
            className={`${ADMIN_INPUT_CLASS} w-48`}
            placeholder="https://..."
          />
        </div>
        {theaters.length > 0 && (
          <div className='flex flex-col gap-1'>
            <label className='text-xs text-gray-400'>Theater</label>
            <Select
              value={form.theaterId}
              onChange={(e) => setForm(f => ({...f, theaterId: e.target.value}))}
              options={[
                { value: '', label: 'My theater' },
                ...theaters.map((theater) => ({ value: theater._id, label: `${theater.name} (${theater.city})` })),
              ]}
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
              <th className='p-2 font-medium'>Price</th>
              <th className='p-2 font-medium'>Status</th>
              <th className='p-2 font-medium'>Actions</th>
            </tr>
          </thead>

          <tbody className='text-sm font-light'>
            {items.map((item) => (
              <tr key={item._id} className='border-b border-primary/20 bg-primary/5 even:bg-primary/10'>
                <td className='p-2 min-w-32 pl-5 font-medium'>{item.name}</td>
                <td className='p-2'>{currency}{item.price}</td>
                <td className='p-2'>
                  {item.isAvailable ? (
                    <span className='text-green-500 text-xs'>Available</span>
                  ) : (
                    <span className='text-red-500 text-xs'>Unavailable</span>
                  )}
                </td>
                <td className='p-2'>
                  <div className='flex gap-2'>
                    <button
                      onClick={() => toggleAvailable(item)}
                      disabled={savingId === item._id}
                      className='text-primary text-xs font-medium cursor-pointer disabled:opacity-50'
                    >
                      {item.isAvailable ? 'Mark unavailable' : 'Mark available'}
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      disabled={savingId === item._id}
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

export default MenuItems
