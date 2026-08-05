import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import { StarIcon, TicketIcon } from "lucide-react";
import { getTheaterPresentation } from "../../lib/theaterPresentation";
import { deriveOpenStatus } from "../../lib/theaterOpenStatus";
import { useAppContext } from "../../context/useAppContext";
import "leaflet/dist/leaflet.css";

const pinIcon = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#F84565;border:2px solid white;box-shadow:0 0 12px rgba(248,69,101,0.8);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const FitBounds = ({ theaters }) => {
  const map = useMap();
  useEffect(() => {
    const valid = theaters.filter((t) => t.geolocation?.lat && t.geolocation?.lng);
    if (valid.length === 0) return;
    const bounds = L.latLngBounds(valid.map((t) => [t.geolocation.lat, t.geolocation.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [theaters, map]);
  return null;
};

const PopupContent = ({ theater }) => {
  const navigate = useNavigate();
  const { axios, setSelectedTheater } = useAppContext();
  const [openStatus, setOpenStatus] = useState(null);
  const { rating } = getTheaterPresentation(theater);

  useEffect(() => {
    let cancelled = false;
    axios
      .get("/api/show/occupancy-pulse", { params: { theaterId: theater._id } })
      .then(({ data }) => {
        if (!cancelled && data.success) setOpenStatus(deriveOpenStatus(data.shows));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [theater, axios]);

  return (
    <div className="text-sm min-w-40">
      <p className="font-medium text-white mb-1">{theater.name}</p>
      <div className="flex items-center gap-2 text-xs text-gray-300 mb-2">
        <span className="flex items-center gap-1">
          <StarIcon className="w-3 h-3 text-nebula-amber fill-nebula-amber" /> {rating}
        </span>
        {openStatus && (
          <span className={openStatus.isOpen ? "text-nebula-cyan" : "text-gray-500"}>
            {openStatus.isOpen ? "Open Now" : "Closed"}
          </span>
        )}
      </div>
      <button
        onClick={() => {
          setSelectedTheater(theater);
          navigate("/movies");
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary text-white cursor-pointer"
      >
        <TicketIcon className="w-3 h-3" /> Book Tickets
      </button>
    </div>
  );
};

const TheaterMap = ({ theaters }) => {
  const validTheaters = theaters.filter((t) => t.geolocation?.lat && t.geolocation?.lng);

  if (validTheaters.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-[32px] overflow-hidden glass-panel p-2 mb-16"
    >
      <div className="rounded-[24px] overflow-hidden h-[420px] relative z-0">
        <MapContainer
          center={[validTheaters[0].geolocation.lat, validTheaters[0].geolocation.lng]}
          zoom={11}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%", background: "#0B0B10" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap contributors'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <FitBounds theaters={validTheaters} />
          {validTheaters.map((theater) => (
            <Marker key={theater._id} position={[theater.geolocation.lat, theater.geolocation.lng]} icon={pinIcon}>
              <Popup>
                <PopupContent theater={theater} />
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </motion.div>
  );
};

export default TheaterMap;
