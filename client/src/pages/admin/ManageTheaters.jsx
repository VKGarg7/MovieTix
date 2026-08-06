import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SuperAdminGate from '../../components/admin/SuperAdminGate';
import { useAppContext } from '../../context/useAppContext';
import useFetchOnUser from '../../hooks/useFetchOnUser';
import toast from 'react-hot-toast';

import InfrastructureHeader from '../../components/admin/theaters/InfrastructureHeader';
import CreateTheaterCard from '../../components/admin/theaters/CreateTheaterCard';
import AdminTheaterCard from '../../components/admin/theaters/AdminTheaterCard';
import TheaterSummaryPanel from '../../components/admin/theaters/TheaterSummaryPanel';
import CreateScreenCard from '../../components/admin/theaters/CreateScreenCard';
import SeatLayoutBuilder from '../../components/admin/theaters/SeatLayoutBuilder';
import SeatMapLivePreview from '../../components/admin/theaters/SeatMapLivePreview';
import ViewFromSeatUploader from '../../components/admin/theaters/ViewFromSeatUploader';
import ScreenSummaryStats from '../../components/admin/theaters/ScreenSummaryStats';
import ExistingScreensList from '../../components/admin/theaters/ExistingScreensList';
import { emptyRow } from '../../lib/seatLayoutBuilder';
import { downloadCsvRows } from '../../lib/downloadCsv';

const emptyTheaterForm = {
  name: '', city: '', address: '', contactEmail: '', timezone: 'Asia/Kolkata', lat: '', lng: '',
};

const ManageTheatersInner = () => {
  const { axios, user, fetchTheaters, fetchScreens } = useAppContext();
  const navigate = useNavigate();
  const currency = import.meta.env.VITE_CURRENCY;

  const [theaters, setTheaters] = useState([]);
  const [theaterForm, setTheaterForm] = useState(emptyTheaterForm);
  const [creatingTheater, setCreatingTheater] = useState(false);
  const [pulseShows, setPulseShows] = useState([]);

  const [selectedTheaterId, setSelectedTheaterId] = useState('');
  const [screens, setScreens] = useState([]);
  const [screenName, setScreenName] = useState('');
  const [projection, setProjection] = useState('2D');
  const [audio, setAudio] = useState('Standard');
  const [rows, setRows] = useState([emptyRow()]);
  const [viewFromSeat, setViewFromSeat] = useState({ front: '', middle: '', back: '' });
  const [creatingScreen, setCreatingScreen] = useState(false);

  const loadTheaters = async () => {
    const list = await fetchTheaters();
    setTheaters(list);
  };

  useFetchOnUser(user, loadTheaters);

  useEffect(() => {
    if (!user) return;
    axios.get('/api/admin/occupancy-pulse')
      .then(({ data }) => { if (data.success) setPulseShows(data.shows); })
      .catch(() => {});
  }, [axios, user]);

  useEffect(() => {
    if (!selectedTheaterId) {
      setScreens([]);
      return;
    }
    fetchScreens(selectedTheaterId).then(setScreens);
  }, [selectedTheaterId, fetchScreens]);

  const theaterStats = useMemo(() => {
    const todayStr = new Date().toDateString();
    const map = {};
    pulseShows.forEach((s) => {
      const tid = s.theaterId?.toString?.() || s.theaterId;
      if (!tid) return;
      if (!map[tid]) map[tid] = { showsToday: 0, revenueToday: 0 };
      if (new Date(s.showDateTime).toDateString() === todayStr) {
        map[tid].showsToday += 1;
        map[tid].revenueToday += s.revenue || 0;
      }
    });
    return map;
  }, [pulseShows]);

  const screenCountByTheater = useMemo(() => {
    // Only the selected theater's screens are loaded; approximate others as unknown until selected.
    if (!selectedTheaterId) return {};
    return { [selectedTheaterId]: screens.length };
  }, [selectedTheaterId, screens]);

  const handleCreateTheater = async (e) => {
    e.preventDefault();
    const { name, city, address, contactEmail, timezone, lat, lng } = theaterForm;

    if (!name || !city || !address || !contactEmail || !timezone || lat === '' || lng === '') {
      return toast.error('All theater fields are required');
    }

    setCreatingTheater(true);
    try {
      const { data } = await axios.post('/api/theater', {
        name, city, address, contactEmail, timezone,
        geolocation: { lat: Number(lat), lng: Number(lng) },
      });

      if (data.success) {
        toast.success('Theater created');
        setTheaterForm(emptyTheaterForm);
        await loadTheaters();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to create theater');
    }
    setCreatingTheater(false);
  };

  const updateRow = (index, field, value) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };
  const addRow = () => setRows((prev) => [...prev, emptyRow(prev)]);
  const duplicateRow = (index) => setRows((prev) => {
    const copy = { ...prev[index] };
    const next = [...prev];
    next.splice(index + 1, 0, { ...copy, label: emptyRow(prev).label });
    return next;
  });
  const removeRow = (index) => setRows((prev) => prev.filter((_, i) => i !== index));

  const handleCreateScreen = async (e) => {
    e.preventDefault();
    if (!selectedTheaterId) return toast.error('Select a theater first');
    if (!screenName) return toast.error('Screen name is required');
    if (rows.length === 0) return toast.error('At least one row is required');

    for (const row of rows) {
      if (!row.label || !/^[A-Za-z]$/.test(row.label)) {
        return toast.error('Each row needs a single-letter label (A-Z)');
      }
      if (!row.seatCount || Number(row.seatCount) < 1 || Number(row.seatCount) > 50) {
        return toast.error('Each row needs a seat count between 1 and 50');
      }
    }

    setCreatingScreen(true);
    try {
      const { data } = await axios.post('/api/screen', {
        theaterId: selectedTheaterId,
        name: screenName,
        rows: rows.map((r) => ({ label: r.label, seatCount: Number(r.seatCount), seatType: r.seatType })),
        viewFromSeat: {
          front: viewFromSeat.front || null,
          middle: viewFromSeat.middle || null,
          back: viewFromSeat.back || null,
        },
      });

      if (data.success) {
        toast.success('Screen created');
        setScreenName('');
        setRows([emptyRow()]);
        setViewFromSeat({ front: '', middle: '', back: '' });
        setScreens(await fetchScreens(selectedTheaterId));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to create screen');
    }
    setCreatingScreen(false);
  };

  const selectedTheater = theaters.find((t) => t._id === selectedTheaterId) || null;
  const totalSeats = screens.reduce((sum, s) => sum + (s.totalCapacity || 0), 0);
  const showsToday = theaterStats[selectedTheaterId]?.showsToday || 0;

  const handleImport = () => toast('Bulk theater import coming soon', { icon: '🚧' });
  const handleExport = () => {
    const rows2 = [
      ['Name', 'City', 'Address', 'Email', 'Timezone', 'Active'],
      ...theaters.map((t) => [t.name, t.city, t.address, t.contactEmail, t.timezone, t.isActive !== false ? 'Active' : 'Inactive']),
    ];
    downloadCsvRows(rows2, `theaters-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('CSV exported');
  };

  const scrollToCreateTheater = () => document.getElementById('create-theater-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="space-y-5 pb-10">
      <InfrastructureHeader onNewTheater={scrollToCreateTheater} onImport={handleImport} onExport={handleExport} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
        <div className="space-y-5">
          <div id="create-theater-panel">
            <CreateTheaterCard form={theaterForm} setForm={setTheaterForm} onSubmit={handleCreateTheater} creating={creatingTheater} />
          </div>

          {theaters.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-300 mb-3 px-1">Theater Management</p>
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {theaters.map((theater, i) => (
                  <AdminTheaterCard
                    key={theater._id}
                    theater={theater}
                    i={i}
                    currency={currency}
                    screenCount={screenCountByTheater[theater._id] ?? (theater._id === selectedTheaterId ? screens.length : '—')}
                    showsToday={theaterStats[theater._id]?.showsToday ?? 0}
                    revenueToday={theaterStats[theater._id]?.revenueToday ?? 0}
                    selected={selectedTheaterId === theater._id}
                    onSelect={() => setSelectedTheaterId(theater._id)}
                    onManageScreens={(t) => setSelectedTheaterId(t._id)}
                    onAnalytics={() => navigate('/admin/dashboard')}
                    onEdit={() => toast('Theater editing coming soon', { icon: '🚧' })}
                    onDelete={() => toast('Theater deletion coming soon', { icon: '🚧' })}
                  />
                ))}
              </motion.div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <TheaterSummaryPanel theater={selectedTheater} screenCount={screens.length} totalSeats={totalSeats} showsToday={showsToday} />

          {selectedTheaterId && (
            <>
              <ExistingScreensList screens={screens} />

              <CreateScreenCard
                screenName={screenName}
                setScreenName={setScreenName}
                projection={projection}
                setProjection={setProjection}
                audio={audio}
                setAudio={setAudio}
              />

              <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5 items-start">
                <SeatLayoutBuilder
                  rows={rows}
                  onUpdateRow={updateRow}
                  onAddRow={addRow}
                  onDuplicateRow={duplicateRow}
                  onDeleteRow={removeRow}
                />
                <SeatMapLivePreview rows={rows} screenName={screenName} />
              </div>

              <ScreenSummaryStats rows={rows} />

              <div className="glass-panel !rounded-3xl p-5 md:p-6">
                <ViewFromSeatUploader viewFromSeat={viewFromSeat} setViewFromSeat={setViewFromSeat} />

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateScreen}
                  disabled={creatingScreen}
                  className="btn-glow w-full mt-5 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium bg-gradient-to-r from-primary via-nebula-magenta to-nebula-violet text-white disabled:opacity-50 cursor-pointer"
                >
                  {creatingScreen ? 'Creating…' : 'Create Screen'}
                </motion.button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ManageTheaters = () => {
  const { adminRole } = useAppContext();
  return (
    <SuperAdminGate
      adminRole={adminRole}
      text1="Manage"
      text2="Theaters"
      message="Only super-admins can create theaters or screens."
    >
      <ManageTheatersInner />
    </SuperAdminGate>
  );
};

export default ManageTheaters;
