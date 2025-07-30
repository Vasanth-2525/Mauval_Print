import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import Head from "../Components/Head";

const Designs = () => {
  const { designs } = useContext(AuthContext);
  const [theme, setTheme] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  // Extract unique theme values from designs
  const themeOptions = ["All", ...Array.from(new Set(designs?.map(d => d.theme).filter(Boolean)))];

  // Filter designs by theme
  const filteredDesigns =
    theme === "All" ? designs : designs.filter(d => d.theme === theme);

  // Pagination logic
  const totalPages = Math.ceil(filteredDesigns.length / ITEMS_PER_PAGE);
  const paginatedDesigns = filteredDesigns.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 if theme changes
  useEffect(() => {
    setCurrentPage(1);
  }, [theme]);

  return (
    <div className="mt-17">
      <Head title="Designs" subtitle="Designs" />

      <div className="min-h-screen bg-[#fef4f3] py-10 px-4">
        <h1 className="text-3xl font-bold text-center mb-6 text-primary">
          Our Designs
        </h1>

        {/* Theme Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {themeOptions.map((t, idx) => (
            <button
              key={idx}
              onClick={() => setTheme(t)}
              className={`px-4 py-1 rounded-full border transition font-medium ${
                theme === t
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-primary border"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Design Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mx-5 justify-items-center">
          {paginatedDesigns.map((design) => (
            <DesignCard
              key={design.id}
              id={design.productId}
              name={design.name}
              rating={design.rating}
              images={design.images || [design.image]}
            />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-10 gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 border rounded-full ${
                  i + 1 === currentPage ? "bg-primary text-white" : ""
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------
// Inline DesignCard Component (Self-contained)
// ---------------------------------------------
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
        <img
          src={images?.[0]}
          alt={name}
          className={`absolute inset-0 w-full h-full object-contain p-4 transition-opacity duration-500 ${
            hovered ? "opacity-0" : "opacity-100"
          }`}
        />
        <img
          src={images?.[1] || images?.[0]}
          alt={name}
          className={`absolute inset-0 w-full h-full object-contain p-4 transform transition-all duration-700 ${
            hovered ? "scale-110 opacity-100" : "scale-100 opacity-0"
          }`}
        />
      </div>

      {/* Bottom Info */}
      <div className="bg-primary text-white flex items-center justify-between px-4 py-3">
        <div>
          <h3 className="font-bold text-lg">{name}</h3>
          <p className="text-sm">⭐ {rating || "0.0"}</p>
        </div>
        <button
          onClick={() => navigate(`/designdetails/${id}`)}
          className="bg-white text-primary border font-semibold text-xs px-4 py-2 rounded-full shadow hover:bg-primary hover:text-white transition cursor-pointer"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
};

export default Designs;