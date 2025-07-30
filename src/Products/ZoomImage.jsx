import React, { useRef, useState } from "react";

const ZoomImage = ({
  imageSrc,
  onImageSelect,
  thumbnails = [],
  selectedImageIndex,
}) => {
  const imageRef = useRef(null);
  const zoomBoxRef = useRef(null);

  const [isZoomVisible, setIsZoomVisible] = useState(false);
  const [zoomBackgroundPosition, setZoomBackgroundPosition] =
    useState("50% 50%");

  const handleMouseMove = (e) => {
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomBackgroundPosition(`${x}% ${y}%`);
    setIsZoomVisible(true);
  };

  const handleMouseLeave = () => {
    setIsZoomVisible(false);
  };

  return (
    <div className="sticky top-28 rounded-xl shadow p-4 space-y-4 w-full ">
      <div className="relative w-full">
        <img
          ref={imageRef}
          src={imageSrc}
          alt="product"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-[400px] h-[400px] object-contain rounded-xl hover:cursor-crosshair mx-auto"
        />

        {isZoomVisible && (
          <div
            ref={zoomBoxRef}
            className="absolute top-0 left-[110%] hidden md:block w-100 h-100 border border-gray-300 rounded-lg shadow-lg bg-white"
            style={{
              backgroundImage: `url(${imageSrc})`,
              backgroundSize: "200%",
              backgroundRepeat: "no-repeat",
              backgroundPosition: zoomBackgroundPosition,
            }}
          />
        )}
      </div>

      <div className="flex gap-2 justify-center flex-wrap">
        {thumbnails.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt={`Thumbnail ${idx + 1}`}
            onClick={() => onImageSelect(idx)}
            className={`w-16 h-16 border p-1 rounded object-contain cursor-pointer transition ${
              selectedImageIndex === idx
                ? "border-blue-500 ring-2 ring-blue-300"
                : "border-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ZoomImage;
