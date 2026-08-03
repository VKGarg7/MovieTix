import React, { useEffect, useState } from 'react'
import Loading from '../../components/Loading';
import Title from '../../components/admin/Title';
import PaginationControls from '../../components/admin/PaginationControls';
import { dateFormat } from "../../lib/dateFomat";
import { useAppContext } from '../../context/useAppContext';

const ListBookings = () => {

  const {axios , getToken , user} = useAppContext();

  const currency = import.meta.env.VITE_CURRENCY 

  const [bookings , setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const getAllBookings = async (targetPage) => {
    try {
      const {data} = await axios.get("/api/admin/all-bookings", {
        params: { page: targetPage },
        headers: {Authorization: `Bearer ${await getToken()}` },
      });
      setBookings(data.bookings);
      setTotalPages(data.pageInfo?.totalPages || 1);
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if(user){
      getAllBookings(page);
    }
    // only re-run when the user or page changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[user, page]);

  return !isLoading ? (
    <>
     <Title text1="List" text2="Bookings"/>
     <div className='max-w-4xl mt-6 overflow-x-auto'>
      <table className='w-full border-collapse rounded-md overflow-hidden text-nowrap'> 
        
        <thead>
          <tr className='bg-primary/20 text-left text-white'>
            <th className='p-2 font-medium pl-5'>User Name</th>
            <th className='p-2 font-medium'>Movie Name</th>
            <th className='p-2 font-medium'>Show Time</th>
            <th className='p-2 font-medium'>Seats</th>
            <th className='p-2 font-medium'>Amount</th>
          </tr>
        </thead>

        <tbody className='text-sm font-light'>
          {bookings.map((item, index) => (
            <tr key={index} className='border-b border-primary/20 bg-primary/5 even:bg-primary/10'>
              <td className='p-2 min-w-45 pl-5'>{item.user?.name || 'Unknown user'}</td>
              <td className='p-2'>{item.show?.movie?.title || 'Show no longer available'}</td>
              <td className='p-2'>{item.show?.showDateTime ? dateFormat(item.show.showDateTime) : '-'}</td>
              <td className='p-2'>{Object.keys(item.bookedSeats).map(seat => item.bookedSeats[seat]).join(", ")}</td>
              <td className='p-2'>{currency}{item.amount}</td>
            </tr>
          ))}
        </tbody>

      </table>
     </div>

     <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
    </>
  ) : <Loading />
}

export default ListBookings
