import React, { useCallback, useEffect, useState } from "react";
import Title from "../../components/admin/Title";
import Loading from "../../components/Loading";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { PlusIcon, Trash2Icon } from "lucide-react";

const emptyScreenForm = { name: "", screenType: "Standard", rowCount: 5, seatsPerRow: 9 };

const Theaters = () => {
  const { axios, getToken, user } = useAppContext();

  const [theaters, setTheaters] = useState(null);
  const [theaterForm, setTheaterForm] = useState({ name: "", city: "", address: "" });
  const [creatingTheater, setCreatingTheater] = useState(false);

  const [screenFormFor, setScreenFormFor] = useState(null); // theaterId currently adding a screen
  const [screenForm, setScreenForm] = useState(emptyScreenForm);
  const [creatingScreen, setCreatingScreen] = useState(false);

  const authHeaders = useCallback(async () => ({ headers: { Authorization: `Bearer ${await getToken()}` } }), [getToken]);

  const fetchTheaters = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/theater/all", await authHeaders());
      if (data.success) {
        setTheaters(data.theaters);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not load theaters");
    }
  }, [axios, authHeaders]);

  useEffect(() => {
    if (user) fetchTheaters();
  }, [user, fetchTheaters]);

  const handleCreateTheater = async (e) => {
    e.preventDefault();
    if (!theaterForm.name || !theaterForm.city || !theaterForm.address) {
      return toast.error("Please fill in all theater fields");
    }
    try {
      setCreatingTheater(true);
      const { data } = await axios.post("/api/theater/create", theaterForm, await authHeaders());
      if (data.success) {
        toast.success("Theater added");
        setTheaterForm({ name: "", city: "", address: "" });
        fetchTheaters();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not create theater");
    }
    setCreatingTheater(false);
  };

  const handleDeleteTheater = async (theaterId) => {
    try {
      const { data } = await axios.delete(`/api/theater/${theaterId}`, await authHeaders());
      if (data.success) {
        toast.success("Theater deleted");
        fetchTheaters();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not delete theater");
    }
  };

  const handleCreateScreen = async (theaterId) => {
    const rowCount = Number(screenForm.rowCount);
    const seatsPerRow = Number(screenForm.seatsPerRow);

    if (!screenForm.name) return toast.error("Please enter a screen name");
    if (!Number.isInteger(rowCount) || rowCount < 1 || rowCount > 26) {
      return toast.error("Rows must be a whole number between 1 and 26");
    }
    if (!Number.isInteger(seatsPerRow) || seatsPerRow < 1 || seatsPerRow > 30) {
      return toast.error("Seats per row must be a whole number between 1 and 30");
    }

    const rows = Array.from({ length: rowCount }, (_, i) => ({
      row: String.fromCharCode(65 + i), // A, B, C, ...
      seats: seatsPerRow,
    }));

    try {
      setCreatingScreen(true);
      const { data } = await axios.post(
        `/api/theater/${theaterId}/screens`,
        { name: screenForm.name, screenType: screenForm.screenType, rows },
        await authHeaders()
      );
      if (data.success) {
        toast.success("Screen added");
        setScreenForm(emptyScreenForm);
        setScreenFormFor(null);
        fetchTheaters();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not create screen");
    }
    setCreatingScreen(false);
  };

  const handleDeleteScreen = async (screenId) => {
    try {
      const { data } = await axios.delete(`/api/theater/screens/${screenId}`, await authHeaders());
      if (data.success) {
        toast.success("Screen deleted");
        fetchTheaters();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not delete screen");
    }
  };

  if (!theaters) return <Loading />;

  return (
    <>
      <Title text1="Manage" text2="Theaters" />

      {/* Add theater form */}
      <form
        onSubmit={handleCreateTheater}
        className="card-surface mt-6 flex flex-wrap gap-3 items-end rounded-xl p-5 max-w-3xl"
      >
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Theater Name</label>
          <input
            value={theaterForm.name}
            onChange={(e) => setTheaterForm((p) => ({ ...p, name: e.target.value }))}
            className="bg-white/5 border border-white/15 hover:border-white/25 focus:border-primary/60 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
            placeholder="e.g. PVR Cinemas"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">City</label>
          <input
            value={theaterForm.city}
            onChange={(e) => setTheaterForm((p) => ({ ...p, city: e.target.value }))}
            className="bg-white/5 border border-white/15 hover:border-white/25 focus:border-primary/60 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
            placeholder="e.g. Mumbai"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Address</label>
          <input
            value={theaterForm.address}
            onChange={(e) => setTheaterForm((p) => ({ ...p, address: e.target.value }))}
            className="bg-white/5 border border-white/15 hover:border-white/25 focus:border-primary/60 rounded-lg px-3 py-2.5 text-sm outline-none w-64 transition-colors"
            placeholder="e.g. Phoenix Mall, Lower Parel"
          />
        </div>
        <button
          type="submit"
          disabled={creatingTheater}
          className="btn-primary text-white px-5 py-2.5 rounded-full text-sm disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
        >
          <PlusIcon className="w-4 h-4" /> Add Theater
        </button>
      </form>

      {/* Theater list */}
      <div className="mt-8 space-y-6 max-w-3xl">
        {theaters.length === 0 && (
          <p className="text-gray-400 text-sm">No theaters yet. Add one above to get started.</p>
        )}

        {theaters.map((theater) => (
          <div key={theater._id} className="card-surface rounded-xl p-5 hover:border-white/20 transition-colors duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold tracking-tight">{theater.name}</p>
                <p className="text-sm text-gray-400 mt-0.5">{theater.city} — {theater.address}</p>
              </div>
              <button
                onClick={() => handleDeleteTheater(theater._id)}
                title="Delete theater (only if it has no screens)"
                className="text-red-500 hover:text-red-400 cursor-pointer transition-colors"
              >
                <Trash2Icon className="w-4 h-4" />
              </button>
            </div>

            {/* Screens */}
            <div className="mt-4 space-y-2">
              {theater.screens.map((screen) => (
                <div
                  key={screen._id}
                  className="flex items-center justify-between text-sm border border-white/10 bg-white/[0.02] rounded-lg px-3 py-2.5"
                >
                  <span>
                    {screen.name}{" "}
                    <span className="text-gray-400">
                      ({screen.screenType}, {screen.rows.length} rows × up to {Math.max(...screen.rows.map(r => r.seats))} seats)
                    </span>
                  </span>
                  <button
                    onClick={() => handleDeleteScreen(screen._id)}
                    title="Delete screen (only if it has no shows scheduled)"
                    className="text-red-500 hover:text-red-400 cursor-pointer transition-colors"
                  >
                    <Trash2Icon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add screen */}
            {screenFormFor === theater._id ? (
              <div className="mt-4 flex flex-wrap gap-3 items-end border-t border-white/10 pt-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Screen Name</label>
                  <input
                    value={screenForm.name}
                    onChange={(e) => setScreenForm((p) => ({ ...p, name: e.target.value }))}
                    className="bg-white/5 border border-white/15 hover:border-white/25 focus:border-primary/60 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
                    placeholder="e.g. Screen 1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Type</label>
                  <input
                    value={screenForm.screenType}
                    onChange={(e) => setScreenForm((p) => ({ ...p, screenType: e.target.value }))}
                    className="bg-white/5 border border-white/15 hover:border-white/25 focus:border-primary/60 rounded-lg px-3 py-2.5 text-sm outline-none w-28 transition-colors"
                    placeholder="Standard / IMAX"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Rows</label>
                  <input
                    type="number"
                    min={1}
                    max={26}
                    value={screenForm.rowCount}
                    onChange={(e) => setScreenForm((p) => ({ ...p, rowCount: e.target.value }))}
                    className="bg-white/5 border border-white/15 hover:border-white/25 focus:border-primary/60 rounded-lg px-3 py-2.5 text-sm outline-none w-20 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Seats / Row</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={screenForm.seatsPerRow}
                    onChange={(e) => setScreenForm((p) => ({ ...p, seatsPerRow: e.target.value }))}
                    className="bg-white/5 border border-white/15 hover:border-white/25 focus:border-primary/60 rounded-lg px-3 py-2.5 text-sm outline-none w-24 transition-colors"
                  />
                </div>
                <button
                  onClick={() => handleCreateScreen(theater._id)}
                  disabled={creatingScreen}
                  className="btn-primary text-white px-4 py-2.5 rounded-full text-sm disabled:opacity-50 cursor-pointer"
                >
                  Save Screen
                </button>
                <button
                  onClick={() => { setScreenFormFor(null); setScreenForm(emptyScreenForm); }}
                  className="text-gray-400 hover:text-gray-200 text-sm px-2 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setScreenFormFor(theater._id)}
                className="mt-4 text-sm text-primary hover:text-primary-soft cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <PlusIcon className="w-3.5 h-3.5" /> Add Screen
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default Theaters;
