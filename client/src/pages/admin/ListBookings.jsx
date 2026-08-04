import React, { useState } from 'react'
import { DownloadIcon } from 'lucide-react';
import Loading from '../../components/Loading';
import Title from '../../components/admin/Title';
import PaginationControls from '../../components/admin/PaginationControls';
import DateRangePicker from '../../components/admin/DateRangePicker';
import { dateFormat } from "../../lib/dateFomat";
import { useAppContext } from '../../context/useAppContext';
import useFetchOnUser from '../../hooks/useFetchOnUser';
import useCsvExport from '../../hooks/useCsvExport';
import { defaultDateRange } from '../../lib/dateRange';

const ListBookings = () => {

  const {axios , user} = useAppContext();

  const currency = import.meta.env.VITE_CURRENCY

  const [bookings , setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [range, setRange] = useState(defaultDateRange);
  const { exporting, exportCsv } = useCsvExport(
    "/api/admin/export-bookings",
    () => `bookings-${range.from}-to-${range.to}.csv`
  );

  const getAllBookings = async (targetPage) => {
    try {
      const {data} = await axios.get("/api/admin/all-bookings", {
        params: { page: targetPage },
      });
      setBookings(data.bookings);
      setTotalPages(data.pageInfo?.totalPages || 1);
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  useFetchOnUser(user, () => getAllBookings(page), [page]);

  const handleExportCsv = () => exportCsv({ from: range.from, to: range.to });

  return !isLoading ? (
    <>
     <Title text1="List" text2="Bookings"/>

     <div className="flex flex-wrap items-end justify-between gap-4 mt-6 max-w-4xl">
       <DateRangePicker
         from={range.from}
         to={range.to}
         onChange={({ from, to }) => setRange((prev) => ({ from: from || prev.from, to: to || prev.to }))}
       />
       <button
         type="button"
         onClick={handleExportCsv}
         disabled={exporting}
         className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary-dull transition rounded-md text-sm font-medium disabled:opacity-50"
       >
         <DownloadIcon className="w-4 h-4" />
         {exporting ? "Exporting…" : "Export CSV"}
       </button>
     </div>

     <div className='max-w-4xl mt-4 overflow-x-auto'>
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
