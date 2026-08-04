import React, { useEffect, useState } from 'react';
import { PlusIcon, TrashIcon } from 'lucide-react';
import Title from '../../components/admin/Title';
import Select from '../../components/admin/Select';
import SuperAdminGate from '../../components/admin/SuperAdminGate';
import { useAppContext } from '../../context/useAppContext';
import useFetchOnUser from '../../hooks/useFetchOnUser';
import { ADMIN_INPUT_CLASS, ADMIN_SUBMIT_BTN_CLASS } from '../../lib/adminStyles';
import toast from 'react-hot-toast';

const SEAT_TYPE_OPTIONS = [
  { value: 'regular', label: 'Regular' },
  { value: 'premium', label: 'Premium' },
  { value: 'recliner', label: 'Recliner' },
  { value: 'accessible', label: 'Accessible' },
];

const emptyTheaterForm = {
  name: '',
  city: '',
  address: '',
  contactEmail: '',
  timezone: 'Asia/Kolkata',
  lat: '',
  lng: '',
};

const emptyRow = () => ({ label: '', seatCount: '', seatType: 'regular' });

const VIEW_FROM_SEAT_BANDS = [
  { key: 'front', label: 'Front rows' },
  { key: 'middle', label: 'Middle rows' },
  { key: 'back', label: 'Back rows' },
];

const ManageTheaters = () => {
  const { axios, user, adminRole, fetchTheaters, fetchScreens } = useAppContext();

  const [theaters, setTheaters] = useState([]);
  const [theaterForm, setTheaterForm] = useState(emptyTheaterForm);
  const [creatingTheater, setCreatingTheater] = useState(false);

  const [selectedTheaterId, setSelectedTheaterId] = useState('');
  const [screens, setScreens] = useState([]);
  const [screenName, setScreenName] = useState('');
  const [rows, setRows] = useState([emptyRow()]);
  const [viewFromSeat, setViewFromSeat] = useState({ front: '', middle: '', back: '' });
  const [creatingScreen, setCreatingScreen] = useState(false);

  const loadTheaters = async () => {
    const list = await fetchTheaters();
    setTheaters(list);
  };

  useFetchOnUser(user, loadTheaters);

  useEffect(() => {
    if (!selectedTheaterId) {
      setScreens([]);
      return;
    }
    fetchScreens(selectedTheaterId).then(setScreens);
  }, [selectedTheaterId, fetchScreens]);

  const handleCreateTheater = async () => {
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
    setRows(prev => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const addRow = () => setRows(prev => [...prev, emptyRow()]);
  const removeRow = (index) => setRows(prev => prev.filter((_, i) => i !== index));

  const handleCreateScreen = async () => {
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
        rows: rows.map(r => ({ label: r.label, seatCount: Number(r.seatCount), seatType: r.seatType })),
        viewFromSeat: {
          front: viewFromSeat.front.trim() || null,
          middle: viewFromSeat.middle.trim() || null,
          back: viewFromSeat.back.trim() || null,
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

  return (
    <SuperAdminGate
      adminRole={adminRole}
      text1="Manage"
      text2="Theaters"
      message="Only super-admins can create theaters or screens."
    >
      <Title text1="Manage" text2="Theaters" />

      {/* create theater */}
      <div className="mt-6 max-w-2xl">
        <p className="text-lg font-medium mb-3">New Theater</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            className={ADMIN_INPUT_CLASS}
            placeholder="Name"
            value={theaterForm.name}
            onChange={(e) => setTheaterForm(f => ({ ...f, name: e.target.value }))}
          />
          <input
            className={ADMIN_INPUT_CLASS}
            placeholder="City"
            value={theaterForm.city}
            onChange={(e) => setTheaterForm(f => ({ ...f, city: e.target.value }))}
          />
          <input
            className={`${ADMIN_INPUT_CLASS} sm:col-span-2`}
            placeholder="Address"
            value={theaterForm.address}
            onChange={(e) => setTheaterForm(f => ({ ...f, address: e.target.value }))}
          />
          <input
            className={ADMIN_INPUT_CLASS}
            placeholder="Contact Email"
            type="email"
            value={theaterForm.contactEmail}
            onChange={(e) => setTheaterForm(f => ({ ...f, contactEmail: e.target.value }))}
          />
          <input
            className={ADMIN_INPUT_CLASS}
            placeholder="Timezone (e.g. Asia/Kolkata)"
            value={theaterForm.timezone}
            onChange={(e) => setTheaterForm(f => ({ ...f, timezone: e.target.value }))}
          />
          <input
            className={ADMIN_INPUT_CLASS}
            placeholder="Latitude"
            type="number"
            value={theaterForm.lat}
            onChange={(e) => setTheaterForm(f => ({ ...f, lat: e.target.value }))}
          />
          <input
            className={ADMIN_INPUT_CLASS}
            placeholder="Longitude"
            type="number"
            value={theaterForm.lng}
            onChange={(e) => setTheaterForm(f => ({ ...f, lng: e.target.value }))}
          />
        </div>
        <button
          onClick={handleCreateTheater}
          disabled={creatingTheater}
          className={`${ADMIN_SUBMIT_BTN_CLASS} mt-4`}
        >
          {creatingTheater ? 'Creating...' : 'Create Theater'}
        </button>
      </div>

      {/* create screen */}
      <div className="mt-10 max-w-2xl">
        <p className="text-lg font-medium mb-3">New Screen</p>

        <Select
          value={selectedTheaterId}
          onChange={(e) => setSelectedTheaterId(e.target.value)}
          options={[
            { value: '', label: 'Select a theater' },
            ...theaters.map(t => ({ value: t._id, label: `${t.name} — ${t.city}` })),
          ]}
          className="w-full sm:w-80"
        />

        {selectedTheaterId && (
          <>
            {screens.length > 0 && (
              <p className="text-sm text-gray-400 mt-3">
                Existing screens: {screens.map(s => s.name).join(', ')}
              </p>
            )}

            <input
              className={`${ADMIN_INPUT_CLASS} mt-3 w-full sm:w-80`}
              placeholder="Screen name (e.g. Screen 1)"
              value={screenName}
              onChange={(e) => setScreenName(e.target.value)}
            />

            <div className="mt-4 space-y-2">
              {rows.map((row, index) => (
                <div key={index} className="flex flex-wrap items-center gap-2">
                  <input
                    className={`${ADMIN_INPUT_CLASS} w-16`}
                    placeholder="A"
                    maxLength={1}
                    value={row.label}
                    onChange={(e) => updateRow(index, 'label', e.target.value.toUpperCase())}
                  />
                  <input
                    className={`${ADMIN_INPUT_CLASS} w-24`}
                    placeholder="Seats"
                    type="number"
                    min={1}
                    max={50}
                    value={row.seatCount}
                    onChange={(e) => updateRow(index, 'seatCount', e.target.value)}
                  />
                  <Select
                    value={row.seatType}
                    onChange={(e) => updateRow(index, 'seatType', e.target.value)}
                    options={SEAT_TYPE_OPTIONS}
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    disabled={rows.length === 1}
                    className="text-red-500 hover:text-rose-700 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addRow}
                className="flex items-center gap-1 text-sm text-primary hover:text-primary-dull mt-1"
              >
                <PlusIcon className="w-4 h-4" /> Add row
              </button>
            </div>

            <p className="text-sm font-medium mt-6 mb-1">"View From Your Seat" preview images (optional)</p>
            <p className="text-xs text-gray-400 mb-2">
              A hosted image URL per row-band. Leave blank to skip — the seat map degrades gracefully
              with a "no preview available" message. For small screens, filling only one band is fine;
              it's shown for every row.
            </p>
            <div className="space-y-2">
              {VIEW_FROM_SEAT_BANDS.map(({ key, label }) => (
                <input
                  key={key}
                  className={`${ADMIN_INPUT_CLASS} w-full`}
                  placeholder={`${label} image URL`}
                  type="url"
                  value={viewFromSeat[key]}
                  onChange={(e) => setViewFromSeat((prev) => ({ ...prev, [key]: e.target.value }))}
                />
              ))}
            </div>

            <button
              onClick={handleCreateScreen}
              disabled={creatingScreen}
              className={`${ADMIN_SUBMIT_BTN_CLASS} mt-4`}
            >
              {creatingScreen ? 'Creating...' : 'Create Screen'}
            </button>
          </>
        )}
      </div>
    </SuperAdminGate>
  );
};

export default ManageTheaters;
