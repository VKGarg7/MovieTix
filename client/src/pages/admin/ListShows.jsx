import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Loading from '../../components/Loading';
import { useAppContext } from '../../context/useAppContext';
import toast from 'react-hot-toast';

import ShowManagementHeader from '../../components/admin/listshows/ShowManagementHeader';
import ShowKpiRow from '../../components/admin/listshows/ShowKpiRow';
import ShowFilterBar from '../../components/admin/listshows/ShowFilterBar';
import ShowRow from '../../components/admin/listshows/ShowRow';
import ShowEmptyState from '../../components/admin/listshows/ShowEmptyState';
import BulkActionsBar from '../../components/admin/listshows/BulkActionsBar';
import PaginationShell from '../../components/admin/PaginationShell';
import EditShowModal from '../../components/admin/listshows/EditShowModal';
import { getShowStatus } from '../../lib/showStatus';
import { downloadCsvRows, downloadCsvBlob } from '../../lib/downloadCsv';

const DEFAULT_FILTERS = {
  movieQuery: '', theaterQuery: '', status: 'all', date: '', language: 'all', genre: 'all', relaxed: 'all', sort: 'time-asc',
};

const ListShows = () => {
  const { axios, getToken, user, image_base_url } = useAppContext();
  const navigate = useNavigate();
  const currency = import.meta.env.VITE_CURRENCY;

  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [now, setNow] = useState(Date.now());

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selected, setSelected] = useState([]);
  const [editingShow, setEditingShow] = useState(null);
  const [editDateTime, setEditDateTime] = useState('');
  const [editPrice, setEditPrice] = useState('');

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const getAllShows = async (targetPage = page, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await axios.get("/api/admin/all-shows", {
        params: { page: targetPage, limit: pageSize },
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      setShows(data.shows || []);
      setTotalPages(data.pageInfo?.totalPages || 1);
      setTotalCount(data.pageInfo?.total || data.shows?.length || 0);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load shows');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (user) getAllShows(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page, pageSize]);

  const handleRefresh = () => {
    setRefreshing(true);
    getAllShows(page, true);
  };

  const languages = useMemo(
    () => [...new Set(shows.map((s) => s.movie?.original_language).filter(Boolean))],
    [shows]
  );
  const genres = useMemo(
    () => [...new Set(shows.flatMap((s) => (s.movie?.genres || []).map((g) => g.name)).filter(Boolean))],
    [shows]
  );

  const filteredShows = useMemo(() => {
    let list = shows.filter((show) => {
      if (filters.movieQuery && !show.movie?.title?.toLowerCase().includes(filters.movieQuery.toLowerCase())) return false;
      if (filters.theaterQuery && !show.screen?.theater?.name?.toLowerCase().includes(filters.theaterQuery.toLowerCase())) return false;
      if (filters.status !== 'all' && getShowStatus(show, now) !== filters.status) return false;
      if (filters.date && new Date(show.showDateTime).toISOString().slice(0, 10) !== filters.date) return false;
      if (filters.language !== 'all' && show.movie?.original_language !== filters.language) return false;
      if (filters.genre !== 'all' && !(show.movie?.genres || []).some((g) => g.name === filters.genre)) return false;
      if (filters.relaxed === 'relaxed' && !show.isRelaxedScreening) return false;
      return true;
    });

    const occupancyOf = (s) => {
      const cap = s.screen?.totalCapacity || 0;
      const occ = Object.keys(s.occupiedSeats || {}).length;
      return cap > 0 ? occ / cap : 0;
    };
    const revenueOf = (s) => Object.keys(s.occupiedSeats || {}).length * s.showPrice;

    switch (filters.sort) {
      case 'time-desc': list = [...list].sort((a, b) => new Date(b.showDateTime) - new Date(a.showDateTime)); break;
      case 'occupancy-desc': list = [...list].sort((a, b) => occupancyOf(b) - occupancyOf(a)); break;
      case 'revenue-desc': list = [...list].sort((a, b) => revenueOf(b) - revenueOf(a)); break;
      default: list = [...list].sort((a, b) => new Date(a.showDateTime) - new Date(b.showDateTime));
    }
    return list;
  }, [shows, filters, now]);

  const resetFilters = () => setFilters(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState('table');

  const toggleSelect = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const clearSelection = () => setSelected([]);

  const startEdit = (show) => {
    setEditingShow(show);
    setEditDateTime(new Date(show.showDateTime).toISOString().slice(0, 16));
    setEditPrice(show.showPrice);
  };
  const cancelEdit = () => { setEditingShow(null); setEditDateTime(''); setEditPrice(''); };

  const saveEdit = async () => {
    if (!editingShow) return;
    setSavingId(editingShow._id);
    try {
      const { data } = await axios.put(
        `/api/show/${editingShow._id}`,
        { showDateTime: new Date(editDateTime).toISOString(), showPrice: Number(editPrice) },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        toast.success(data.message || 'Show updated');
        cancelEdit();
        getAllShows(page, true);
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
        getAllShows(page, true);
      } else {
        toast.error(data.message || 'Failed to cancel show');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to cancel show');
    }
    setSavingId(null);
  };

  const handleDuplicate = async (show) => {
    try {
      const original = new Date(show.showDateTime);
      const nextDay = new Date(original.getTime() + 24 * 60 * 60 * 1000);
      const { data } = await axios.post(
        '/api/show/add',
        {
          movieId: show.movie?._id,
          showsInput: [{ date: nextDay.toISOString().slice(0, 10), time: nextDay.toISOString().slice(11, 16) }],
          showPrice: show.showPrice,
        },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        toast.success('Show duplicated to next day');
        getAllShows(page, true);
      } else {
        toast.error(data.message || 'Failed to duplicate show');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to duplicate show');
    }
  };

  const handleAnalytics = () => navigate('/admin/dashboard');

  const handleExportTrailerVote = async (show) => {
    try {
      const response = await axios.get(`/api/trailer-vote/${show._id}/export`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
        responseType: 'blob',
      });
      downloadCsvBlob(response.data, `trailer-vote-${show._id}.csv`);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'No trailer vote has been started for this show yet');
    }
  };

  const handleExportCsv = () => {
    const rows = [
      ['Movie', 'Theater', 'Screen', 'Show Time', 'Status', 'Occupied', 'Capacity', 'Revenue'],
      ...filteredShows.map((s) => [
        s.movie?.title || '',
        s.screen?.theater?.name || '',
        s.screen?.name || '',
        new Date(s.showDateTime).toISOString(),
        getShowStatus(s, now),
        Object.keys(s.occupiedSeats || {}).length,
        s.screen?.totalCapacity || 0,
        Object.keys(s.occupiedSeats || {}).length * s.showPrice,
      ]),
    ];
    downloadCsvRows(rows, `shows-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('CSV exported');
  };

  const bulkAction = (label) => () => {
    if (selected.length === 0) return;
    toast(`${label} for ${selected.length} shows — coming soon`, { icon: '🚧' });
  };

  const bulkDelete = async () => {
    if (selected.length === 0) return;
    setSavingId('bulk');
    try {
      const token = await getToken();
      await Promise.all(
        selected.map((id) => axios.delete(`/api/show/${id}`, { headers: { Authorization: `Bearer ${token}` } }))
      );
      toast.success(`${selected.length} shows cancelled`);
      clearSelection();
      getAllShows(page, true);
    } catch {
      toast.error('Some shows failed to cancel');
    }
    setSavingId(null);
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-5 pb-10">
      <ShowManagementHeader onExport={handleExportCsv} onRefresh={handleRefresh} refreshing={refreshing} />

      <ShowKpiRow shows={shows} currency={currency} now={now} />

      <ShowFilterBar
        filters={filters}
        setFilters={setFilters}
        languages={languages}
        genres={genres}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onReset={resetFilters}
        resultCount={filteredShows.length}
      />

      {filteredShows.length === 0 ? (
        <ShowEmptyState
          onAddShow={() => navigate('/admin/add-shows')}
          filtered={shows.length > 0}
          onReset={resetFilters}
        />
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 xl:grid-cols-2 gap-3' : 'space-y-2.5'}>
          <AnimatePresence mode="popLayout">
            {filteredShows.map((show, i) => (
              <ShowRow
                key={show._id}
                show={show}
                i={i}
                now={now}
                currency={currency}
                imageBaseUrl={image_base_url}
                selected={selected.includes(show._id)}
                onToggleSelect={toggleSelect}
                onEdit={startEdit}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onAnalytics={handleAnalytics}
                onExportTrailerVote={handleExportTrailerVote}
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
      />

      <BulkActionsBar
        count={selected.length}
        onClear={clearSelection}
        onDelete={bulkDelete}
        onDuplicate={bulkAction('Duplicate')}
        onMove={bulkAction('Move')}
        onCancel={bulkAction('Cancel')}
        onExport={handleExportCsv}
      />

      <EditShowModal
        show={editingShow}
        dateTime={editDateTime}
        setDateTime={setEditDateTime}
        price={editPrice}
        setPrice={setEditPrice}
        onSave={saveEdit}
        onClose={cancelEdit}
        saving={savingId === editingShow?._id}
      />
    </div>
  );
}

export default ListShows
