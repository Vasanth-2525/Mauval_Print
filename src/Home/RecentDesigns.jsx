

import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";

const DesignCard = ({ id, name, rating, images }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="w-full max-w-sm rounded-2xl overflow-hidden shadow-lg group relative bg-white"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image Container */}
      <div className="w-full h-[300px] relative overflow-hidden bg-primary/10">
        {/* First image (default) */}
        <img
          src={images?.[0]}
          alt={name}
          className={`absolute inset-0 w-full h-full object-contain p-4 transition-opacity duration-500 ${
            hovered ? "opacity-0" : "opacity-100"
          }`}
        />

        {/* Second image (hover zoom in) */}
        <img
          src={images?.[1] || images?.[0]}
          alt={name}
          className={`absolute inset-0 w-full h-full object-contain p-4 transform transition-all duration-700 ${
            hovered ? "scale-110 opacity-100" : "scale-100 opacity-0"
          }`}
        />
      </div>

      {/* Bottom info bar */}
      <div className="bg-primary text-white flex items-center justify-between px-4 py-3">
        <div>
          <h3 className="font-bold text-lg">{name}</h3>
          <p className="text-sm">⭐ {rating || "0.0"}</p>
        </div>
        <button
          onClick={() => navigate(`/designdetails/${id}`)}
          className="bg-white hover:border-white border text-primary font-semibold text-xs px-4 py-2 rounded-full shadow hover:bg-primary hover:text-white transition cursor-pointer"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
};

const RecentDesigns = () => {
  const { designs } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-[#fef4f3] py-10 px-4">
      <h1 className="text-3xl font-bold text-center mb-10 text-primary">
        Our RecentDesigns
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mx-5 justify-items-center">
        {designs?.slice(0, 8).map((design) => (
          <DesignCard
            key={design.id}
            id={design.productId}
            name={design.name}
            rating={design.rating}
            images={design.images || [design.image]}
          />
        ))}
      </div>
    </div>
  );
};

export default RecentDesigns;