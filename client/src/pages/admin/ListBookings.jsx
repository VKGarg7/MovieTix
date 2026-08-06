import React, { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import Loading from '../../components/Loading';
import { useAppContext } from '../../context/useAppContext';
import useFetchOnUser from '../../hooks/useFetchOnUser';
import useCsvExport from '../../hooks/useCsvExport';
import { defaultDateRange } from '../../lib/dateRange';
import toast from 'react-hot-toast';

import DateRangePicker from '../../components/admin/DateRangePicker';
import BookingIntelligenceHeader from '../../components/admin/listbookings/BookingIntelligenceHeader';
import BookingKpiRow from '../../components/admin/listbookings/BookingKpiRow';
import BookingFilterBar from '../../components/admin/listbookings/BookingFilterBar';
import BookingRow from '../../components/admin/listbookings/BookingRow';
import BookingEmptyState from '../../components/admin/listbookings/BookingEmptyState';
import PaginationShell from '../../components/admin/PaginationShell';
import { getBookingStatus, getPaymentStatus } from '../../lib/bookingStatus';

const DEFAULT_FILTERS = {
  bookingQuery: '', customerQuery: '', movie: 'all', theater: 'all', status: 'all',
  payment: 'all', date: '', seatType: 'all', sort: 'date-desc',
};

const ListBookings = () => {
  const { axios, user, image_base_url } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY;

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingId] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [range, setRange] = useState(defaultDateRange);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const { exporting, exportCsv } = useCsvExport(
    "/api/admin/export-bookings",
    () => `bookings-${range.from}-to-${range.to}.csv`
  );

  const getAllBookings = async (targetPage = page, silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const { data } = await axios.get("/api/admin/all-bookings", {
        params: { page: targetPage, limit: pageSize },
      });
      setBookings(data.bookings || []);
      setTotalPages(data.pageInfo?.totalPages || 1);
      setTotalCount(data.pageInfo?.total || data.bookings?.length || 0);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load bookings');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFetchOnUser(user, () => getAllBookings(page), [page, pageSize]);

  const handleRefresh = () => {
    setRefreshing(true);
    getAllBookings(page, true);
  };

  const handleExportCsv = () => exportCsv({ from: range.from, to: range.to });
  const handleDownloadReport = () => {
    exportCsv({ from: range.from, to: range.to });
    toast('Report generation uses the CSV export for now', { icon: '📄' });
  };

  const customerCounts = useMemo(() => {
    const counts = {};
    bookings.forEach((b) => {
      const id = b.user?._id || b.user;
      if (!id) return;
      counts[id] = (counts[id] || 0) + 1;
    });
    return counts;
  }, [bookings]);

  const movies = useMemo(() => [...new Set(bookings.map((b) => b.show?.movie?.title).filter(Boolean))], [bookings]);
  const theaters = useMemo(() => [...new Set(bookings.map((b) => b.show?.screen?.theater?.name).filter(Boolean))], [bookings]);
  const seatTypes = useMemo(() => {
    const types = new Set();
    bookings.forEach((b) => (b.bookedSeats || []).forEach((s) => {
      if (s && typeof s === 'object' && s.seatType) types.add(s.seatType);
    }));
    return [...types];
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    let list = bookings.filter((b) => {
      const idMatch = b._id?.toLowerCase().includes(filters.bookingQuery.toLowerCase());
      if (filters.bookingQuery && !idMatch) return false;
      if (filters.customerQuery) {
        const q = filters.customerQuery.toLowerCase();
        const matches = b.user?.name?.toLowerCase().includes(q) || b.user?.email?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (filters.movie !== 'all' && b.show?.movie?.title !== filters.movie) return false;
      if (filters.theater !== 'all' && b.show?.screen?.theater?.name !== filters.theater) return false;
      if (filters.status !== 'all' && getBookingStatus(b) !== filters.status) return false;
      if (filters.payment !== 'all' && getPaymentStatus(b) !== filters.payment) return false;
      if (filters.date && new Date(b.createdAt).toISOString().slice(0, 10) !== filters.date) return false;
      if (filters.seatType !== 'all') {
        const hasType = (b.bookedSeats || []).some((s) => s && typeof s === 'object' && s.seatType === filters.seatType);
        if (!hasType) return false;
      }
      return true;
    });

    switch (filters.sort) {
      case 'date-asc': list = [...list].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
      case 'amount-desc': list = [...list].sort((a, b) => b.amount - a.amount); break;
      case 'amount-asc': list = [...list].sort((a, b) => a.amount - b.amount); break;
      default: list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return list;
  }, [bookings, filters]);

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const handleView = () => {};
  const handlePrint = () => toast('Preparing ticket for print…', { icon: '🖨️' });
  const handleInvoice = () => toast('Invoice download coming soon', { icon: '🧾' });
  const handleRefund = (booking) => toast(`Refund flow for #${booking._id.slice(-8).toUpperCase()} — coming soon`, { icon: '🚧' });
  const handleDelete = (booking) => toast(`Delete for #${booking._id.slice(-8).toUpperCase()} — coming soon`, { icon: '🚧' });

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-5 pb-10">
      <BookingIntelligenceHeader
        onExport={handleExportCsv}
        onRefresh={handleRefresh}
        onReport={handleDownloadReport}
        refreshing={refreshing}
        exporting={exporting}
      />

      <div className="glass-panel !rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-gray-500">Export date range</span>
        <DateRangePicker
          from={range.from}
          to={range.to}
          onChange={({ from, to }) => setRange((prev) => ({ from: from || prev.from, to: to || prev.to }))}
        />
      </div>

      <BookingKpiRow bookings={bookings} currency={currency} />

      <BookingFilterBar
        filters={filters}
        setFilters={setFilters}
        movies={movies}
        theaters={theaters}
        seatTypes={seatTypes}
        onReset={resetFilters}
        resultCount={filteredBookings.length}
      />

      {filteredBookings.length === 0 ? (
        <BookingEmptyState filtered={bookings.length > 0} onReset={resetFilters} />
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence mode="popLayout">
            {filteredBookings.map((booking, i) => (
              <BookingRow
                key={booking._id}
                booking={booking}
                i={i}
                currency={currency}
                imageBaseUrl={image_base_url}
                customerBookingCount={customerCounts[booking.user?._id || booking.user] || 1}
                onView={handleView}
                onPrint={handlePrint}
                onInvoice={handleInvoice}
                onRefund={handleRefund}
                onDelete={handleDelete}
                savingId={savingId}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <PaginationShell
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
        label="bookings"
      />
    </div>
  );
}

export default ListBookings
