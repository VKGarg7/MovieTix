import React, { useRef } from "react";
import { motion } from "framer-motion";
import { ImageUpIcon, XIcon } from "lucide-react";
import toast from "react-hot-toast";

const MAX_SIZE_BYTES = 2 * 1024 * 1024;

const ImageUploadField = ({ value, onChange }) => {
  const inputRef = useRef(null);

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
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-white/10 group/img">
          <img src={value} alt="" className="w-full h-32 object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 border border-white/20 flex items-center justify-center text-gray-300 hover:text-white cursor-pointer"
          >
            <XIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <motion.button
          type="button"
          whileHover={{ scale: 1.01 }}
          onClick={() => inputRef.current?.click()}
          className="w-full h-32 rounded-xl border-2 border-dashed border-white/15 hover:border-primary/40 bg-white/[0.02] flex flex-col items-center justify-center gap-1.5 text-gray-500 hover:text-gray-300 cursor-pointer transition-colors"
        >
          <ImageUpIcon className="w-6 h-6" />
          <span className="text-xs">Click to upload image</span>
        </motion.button>
      )}
    </div>
  );
};

export default ImageUploadField;
