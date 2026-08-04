import React from "react";
import { ImageOffIcon, XIcon } from "lucide-react";

const ViewFromSeatPreview = ({ seatId, imageUrl, onClose }) => {
  if (!seatId) return null;

  return (
    <div className="w-full max-w-xs bg-primary/5 border border-primary/20 rounded-lg p-3 mt-4 mx-auto">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium">View from seat {seatId}</p>
        <button onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer" aria-label="Close preview">
          <XIcon className="w-4 h-4" />
        </button>
      </div>

      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`Approximate view from seat ${seatId}`}
          className="w-full rounded-md object-cover aspect-video"
        />
      ) : (
        <div className="w-full aspect-video rounded-md bg-black/20 flex flex-col items-center justify-center gap-1.5 text-gray-500 text-xs">
          <ImageOffIcon className="w-6 h-6" />
          No preview available for this section yet
        </div>
      )}
    </div>
  );
};

export default ViewFromSeatPreview;
