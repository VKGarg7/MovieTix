import React, { useEffect, useState } from 'react'
import { dummyBookingData } from '../../assets/assets';
import Loading from '../../components/Loading';
import Title from '../../components/admin/Title';
import { dateFormat } from "../../lib/dateFomat";
import { useAppContext } from '../../context/AppContext';

const ListBookings = () => {

  const {axios , getToken , user} = useAppContext();

  const currency = import.meta.env.VITE_CURRENCY 

  const [bookings , setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getAllBookings = async () => {
    try {
      const {data} = await axios.get("/api/admin/all-bookings", { headers: {Authorization: `Bearer ${await getToken()}` }});
      setBookings(data.bookings);
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if(user){
      getAllBookings();
    }
  },[user]);

  return !isLoading ? (
    <>
     <Title text1="List" text2="Bookings"/>
     <div className='max-w-4xl mt-6 overflow-x-auto card-surface rounded-xl'>
      <table className='w-full border-collapse text-nowrap'>

        <thead>
          <tr className='bg-white/5 text-left text-gray-300 border-b border-white/10'>
            <th className='p-3 font-medium pl-5'>User Name</th>
            <th className='p-3 font-medium'>Movie Name</th>
            <th className='p-3 font-medium'>Show Time</th>
            <th className='p-3 font-medium'>Seats</th>
            <th className='p-3 font-medium'>Amount</th>
          </tr>
        </thead>

        <tbody className='text-sm font-light'>
          {bookings.map((item, index) => (
            <tr key={index} className='border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors'>
              <td className='p-3 min-w-45 pl-5 font-medium'>{item.user.name}</td>
              <td className='p-3 text-gray-300'>{item.show.movie.title}</td>
              <td className='p-3 text-gray-300'>{dateFormat(item.show.showDateTime)}</td>
              <td className='p-3 text-gray-300'>{Object.keys(item.bookedSeats).map(seat => item.bookedSeats[seat]).join(", ")}</td>
              <td className='p-3 text-primary font-medium'>{currency}{item.amount}</td>
            </tr>
          ))}
        </tbody>

      </table>
     </div>
    </>
  ) : <Loading />
}

export default ListBookings
