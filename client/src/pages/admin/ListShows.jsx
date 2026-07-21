import React, { useEffect, useState } from 'react'
import Loading from '../../components/Loading';
import Title from '../../components/admin/Title';
import { dateFormat } from "../../lib/dateFomat";
import { useAppContext } from '../../context/AppContext';

const ListShows = () => {

  const {axios , getToken , user} = useAppContext();

  const currency = import.meta.env.VITE_CURRENCY;
  
  const [shows , setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if(!user) return;

    const getAllShows = async () => {
      try{
        const {data} = await axios.get("/api/admin/all-shows", { headers: {Authorization: `Bearer ${await getToken()}` }});
        setShows(data.shows)
        setLoading(false);
      } catch (error) {
        console.error(error);
      }
    };
    getAllShows();
  },[user, axios, getToken]);

  return !loading ? (
    <>
      <Title text1="List" text2="Shows"/> 
      <div className='max-w-4xl mt-6 overflow-x-auto card-surface rounded-xl'>
        <table className='w-full border-collapse text-nowrap'>
          <thead>
            <tr className='bg-white/5 text-left text-gray-300 border-b border-white/10'>
              <th className='p-3 font-medium pl-5'>Movie Name</th>
              <th className='p-3 font-medium'>Theater / Screen</th>
              <th className='p-3 font-medium'>Show Time</th>
              <th className='p-3 font-medium'>Total Bookings</th>
              <th className='p-3 font-medium'>Earnings</th>
            </tr>
          </thead>

          <tbody className='text-sm font-light'>
            {shows.map((show , index) => (
              <tr key={index} className='border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors'>
                  <td className='p-3 min-w-45 pl-5 font-medium'>{show.movie.title}</td>
                  <td className='p-3 text-gray-300'>{show.screen ? `${show.screen.theater?.name} — ${show.screen.name}` : '-'}</td>
                  <td className='p-3 text-gray-300'>{dateFormat(show.showDateTime)}</td>
                  <td className='p-3 text-gray-300'>{Object.keys(show.occupiedSeats).length}</td>
                  <td className='p-3 text-primary font-medium'>{currency}{Object.keys(show.occupiedSeats).length * show.showPrice}</td>
              </tr>
            ) )}
          </tbody>

        </table>
      </div>
    </>
  ) : <Loading />;
}

export default ListShows
