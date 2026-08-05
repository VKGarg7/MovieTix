import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ImageUpIcon, XIcon } from "lucide-react";
import toast from "react-hot-toast";

const MAX_SIZE_BYTES = 2 * 1024 * 1024;

const UploadSlot = ({ label, value, onChange }) => {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file");
    if (file.size > MAX_SIZE_BYTES) return toast.error("Image must be under 2MB");
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <p className="text-xs text-gray-400 mb-1.5">{label}</p>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-white/10 group/img">
          <img src={value} alt="" className="w-full h-24 object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/70 border border-white/20 flex items-center justify-center text-gray-300 hover:text-white cursor-pointer"
          >
            <XIcon className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <motion.button
          type="button"
          whileHover={{ scale: 1.01 }}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={`w-full h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-gray-300 cursor-pointer transition-colors ${
            dragOver ? "border-primary/60 bg-primary/5" : "border-white/15 hover:border-primary/40 bg-white/[0.02]"
          }`}
        >
          <ImageUpIcon className="w-5 h-5" />
          <span className="text-[10px]">Drop or click to upload</span>
        </motion.button>
      )}
    </div>
  );
};

const ViewFromSeatUploader = ({ viewFromSeat, setViewFromSeat }) => (
  <div>
    <p className="text-sm font-medium mb-1">View From Your Seat</p>
    <p className="text-xs text-gray-500 mb-3">Optional preview images shown to customers during seat selection.</p>
    <div className="grid grid-cols-3 gap-2.5">
      <UploadSlot label="Front View" value={viewFromSeat.front} onChange={(v) => setViewFromSeat((f) => ({ ...f, front: v }))} />
      <UploadSlot label="Middle View" value={viewFromSeat.middle} onChange={(v) => setViewFromSeat((f) => ({ ...f, middle: v }))} />
      <UploadSlot label="Back View" value={viewFromSeat.back} onChange={(v) => setViewFromSeat((f) => ({ ...f, back: v }))} />
    </div>
  </div>
);

export default ViewFromSeatUploader;
