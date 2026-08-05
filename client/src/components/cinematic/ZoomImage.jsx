import React from "react";

const ZoomImage = ({ src, alt = "", className = "", imgClassName = "", children }) => (
  <div className={`relative overflow-hidden ${className}`}>
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-110 ${imgClassName}`}
    />
    {children}
  </div>
);

export default ZoomImage;
