import React, { useState } from "react";
import { motion } from "framer-motion";
import { Building2Icon, CrosshairIcon, PlusIcon } from "lucide-react";
import toast from "react-hot-toast";
import MapPreview from "./MapPreview";

const FieldLabel = ({ children }) => <label className="text-xs text-gray-400 mb-1 block">{children}</label>;
const inputCls = "w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/40";

const CreateTheaterCard = ({ form, setForm, onSubmit, creating }) => {
  const [locating, setLocating] = useState(false);
  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const autoDetect = () => {
    if (!navigator.geolocation) return toast.error("Geolocation is not supported by this browser");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }));
        toast.success("Coordinates detected");
        setLocating(false);
      },
      () => {
        toast.error("Could not detect location — enter coordinates manually");
        setLocating(false);
      }
    );
  };

  return (
    <div className="glass-panel !rounded-3xl p-5 md:p-6">
      <h2 className="font-display text-xl font-medium flex items-center gap-2">
        <Building2Icon className="w-4.5 h-4.5 text-nebula-violet" /> New Theater
      </h2>
      <p className="text-sm text-gray-500 mt-1 mb-5">Register a new multiplex location.</p>

      <form onSubmit={onSubmit} className="space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <FieldLabel>Theater Name</FieldLabel>
            <input value={form.name} onChange={update("name")} placeholder="PVR Icon" className={inputCls} />
          </div>
          <div>
            <FieldLabel>City</FieldLabel>
            <input value={form.city} onChange={update("city")} placeholder="Noida" className={inputCls} />
          </div>
        </div>

        <div>
          <FieldLabel>Address</FieldLabel>
          <input value={form.address} onChange={update("address")} placeholder="DLF Mall of India, Sector 18" className={inputCls} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <FieldLabel>Email</FieldLabel>
            <input type="email" value={form.contactEmail} onChange={update("contactEmail")} placeholder="theater@example.com" className={inputCls} />
          </div>
          <div>
            <FieldLabel>Timezone</FieldLabel>
            <input value={form.timezone} onChange={update("timezone")} placeholder="Asia/Kolkata" className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <FieldLabel>Latitude</FieldLabel>
            <input type="number" value={form.lat} onChange={update("lat")} className={inputCls} />
          </div>
          <div>
            <FieldLabel>Longitude</FieldLabel>
            <input type="number" value={form.lng} onChange={update("lng")} className={inputCls} />
          </div>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={autoDetect}
          disabled={locating}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs border border-white/10 text-gray-300 hover:bg-white/5 disabled:opacity-50 cursor-pointer transition-colors"
        >
          <CrosshairIcon className={`w-3.5 h-3.5 ${locating ? "animate-spin" : ""}`} />
          {locating ? "Detecting…" : "Auto-detect coordinates"}
        </motion.button>

        <MapPreview lat={form.lat} lng={form.lng} address={form.address} />

        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={creating}
          className="btn-glow w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium bg-gradient-to-r from-primary via-nebula-magenta to-nebula-violet text-white disabled:opacity-50 cursor-pointer"
        >
          <PlusIcon className="w-4 h-4" />
          {creating ? "Creating…" : "Create Theater"}
        </motion.button>
      </form>
    </div>
  );
};

export default CreateTheaterCard;
