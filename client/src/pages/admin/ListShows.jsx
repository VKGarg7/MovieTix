import React, { useEffect, useState } from 'react'
import Loading from '../../components/Loading';
import Title from '../../components/admin/Title';
import { dateFormat } from "../../lib/dateFomat";
import { useAppContext } from '../../context/useAppContext';
import toast from 'react-hot-toast';

const ListShows = () => {

  const {axios , getToken , user} = useAppContext();

  const currency = import.meta.env.VITE_CURRENCY;

  const [shows , setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingShow, setEditingShow] = useState(null);
  const [editDateTime, setEditDateTime] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [savingId, setSavingId] = useState(null);

  const getAllShows = async () => {
    try{
      const {data} = await axios.get("/api/admin/all-shows", { headers: {Authorization: `Bearer ${await getToken()}` }});
      setShows(data.shows)
      setLoading(false);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    if(user){
      getAllShows();
    }
    // only re-run when the user changes, not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[user]);

  const startEdit = (show) => {
    setEditingShow(show._id);
    // toDatetimeLocal expects "YYYY-MM-DDTHH:mm"
    setEditDateTime(new Date(show.showDateTime).toISOString().slice(0, 16));
    setEditPrice(show.showPrice);
  };

  const cancelEdit = () => {
    setEditingShow(null);
    setEditDateTime('');
    setEditPrice('');
  };

  const saveEdit = async (showId) => {
    setSavingId(showId);
    try {
      const { data } = await axios.put(
        `/api/show/${showId}`,
        { showDateTime: new Date(editDateTime).toISOString(), showPrice: Number(editPrice) },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        toast.success(data.message || 'Show updated');
        cancelEdit();
        getAllShows();
      } else {
        toast.error(data.message || 'Failed to update show');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update show');
    }
    setSavingId(null);
  };

  const handleDelete = async (showId) => {
    setSavingId(showId);
    try {
      const { data } = await axios.delete(`/api/show/${showId}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        toast.success(data.message || 'Show cancelled');
        getAllShows();
      } else {
        toast.error(data.message || 'Failed to cancel show');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to cancel show');
    }
    setSavingId(null);
  };

  return !loading ? (
    <>
      <Title text1="List" text2="Shows"/>
      <div className='max-w-4xl mt-6 overflow-x-auto'>
        <table className='w-full border-collapse rounded-md overflow-hidden text-nowrap'>
          <thead>
            <tr className='bg-primary/20 text-left text-white'>
              <th className='p-2 font-medium pl-5'>Movie Name</th>
              <th className='p-2 font-medium'>Show Time</th>
              <th className='p-2 font-medium'>Total Bookings</th>
              <th className='p-2 font-medium'>Earnings</th>
              <th className='p-2 font-medium'>Actions</th>
            </tr>
          </thead>

          <tbody className='text-sm font-light'>
            {shows.map((show , index) => (
              <tr key={index} className='border-b border-primary/20 bg-primary/5 even:bg-primary/10'>
                  <td className='p-2 min-w-45 pl-5'>
                    {show.movie.title}
                    {show.isCancelled && <span className='ml-2 text-red-500 text-xs'>(Cancelled)</span>}
                  </td>
                  {editingShow === show._id ? (
                    <td className='p-2'>
                      <input
                        type="datetime-local"
                        value={editDateTime}
                        onChange={(e) => setEditDateTime(e.target.value)}
                        className='bg-primary/10 border border-primary/30 rounded px-2 py-1 text-xs'
                      />
                    </td>
                  ) : (
                    <td className='p-2'>{dateFormat(show.showDateTime)}</td>
                  )}
                  <td className='p-2'>{Object.keys(show.occupiedSeats).length}</td>
                  <td className='p-2'>
                    {editingShow === show._id ? (
                      <input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className='bg-primary/10 border border-primary/30 rounded px-2 py-1 text-xs w-20'
                      />
                    ) : (
                      <>{currency}{Object.keys(show.occupiedSeats).length * show.showPrice}</>
                    )}
                  </td>
                  <td className='p-2'>
                    {show.isCancelled ? null : editingShow === show._id ? (
                      <div className='flex gap-2'>
                        <button
                          onClick={() => saveEdit(show._id)}
                          disabled={savingId === show._id}
                          className='text-primary text-xs font-medium cursor-pointer disabled:opacity-50'
                        >
                          Save
                        </button>
                        <button onClick={cancelEdit} className='text-gray-400 text-xs font-medium cursor-pointer'>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className='flex gap-2'>
                        <button onClick={() => startEdit(show)} className='text-primary text-xs font-medium cursor-pointer'>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(show._id)}
                          disabled={savingId === show._id}
                          className='text-red-500 text-xs font-medium cursor-pointer disabled:opacity-50'
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
              </tr>
            ) )}
          </tbody>

        </table>
      </div>
    </>
  ) : <Loading />;
}

export default ListShows
