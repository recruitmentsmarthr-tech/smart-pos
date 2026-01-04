import React, { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'; // Import necessary icons
import api from '~/api';

const ProductCard = React.memo(({ product, onAddToCart }) => {
  const currentThemeClasses = 'bg-white border-slate-200';
  const accentColorClass = 'text-indigo-600';

  // Re-introducing carousel state and logic
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [randomDelay] = useState(() => Math.random() * (20000 - 10000) + 10000); // Random delay between 10 and 20 seconds
  const [isFading, setIsFading] = useState(false); // New state for fade effect

  const getImageUrl = (relativePath) => {
    if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
      return relativePath;
    }
    return `${api.defaults.baseURL}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
  };

  const productImages = product.images && product.images.length > 0 ? product.images : [];

  useEffect(() => {
    let interval;
    if (productImages.length > 1 && !isHovered) {
      interval = setInterval(() => {
        setIsFading(true); // Start fade-out
        setTimeout(() => {
          setCurrentImageIndex((prevIndex) =>
            prevIndex === productImages.length - 1 ? 0 : prevIndex + 1
          );
          setIsFading(false); // Start fade-in for new image
        }, 700); // Duration of fade-out
      }, randomDelay);

      return () => clearInterval(interval);
    } else if (productImages.length <= 1) {
      setCurrentImageIndex(0);
    }
  }, [productImages, isHovered, randomDelay]);

  const goToPrevious = (e) => {
    e.stopPropagation();
    setIsFading(true);
    setTimeout(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === 0 ? productImages.length - 1 : prevIndex - 1
      );
      setIsFading(false);
    }, 700);
  };

  const goToNext = (e) => {
    e.stopPropagation();
    setIsFading(true);
    setTimeout(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === productImages.length - 1 ? 0 : prevIndex + 1
      );
      setIsFading(false);
    }, 700);
  };

  let imageContent;
  if (productImages.length > 0) {
    imageContent = (
      <>
        <img
          key={productImages[currentImageIndex]}
          src={getImageUrl(productImages[currentImageIndex])}
          alt={product.name}
          className={`w-full h-full object-cover transition-opacity duration-700 ease-in-out ${isFading ? 'opacity-0' : 'opacity-100'}`} // Apply fade effect
          onError={(e) => { 
              if (e.target.src !== getImageUrl("/static_images/placeholder.png")) {
                  e.target.onerror = null; 
                  e.target.src = getImageUrl("/static_images/placeholder.png");
              }
          }}
        />
        {productImages.length > 1 && isHovered && (
          <>
            <span
              onClick={goToPrevious}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-0.5 rounded-full ml-1 w-6 h-6 flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft size={14} />
            </span>
            <span
              onClick={goToNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-0.5 rounded-full mr-1 w-6 h-6 flex items-center justify-center cursor-pointer"
            >
              <ChevronRight size={14} />
            </span>
          </>
        )}
      </>
    );
  } else {
    imageContent = (
      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-muted-foreground text-xs text-center">
        No Image
      </div>
    );
  }

  // Format arrival date if available
  const formattedArrivalDate = product.arrival_date ? new Date(product.arrival_date).toLocaleDateString() : 'N/A';

  return (
    <button 
      key={product.id} 
      onClick={(e) => { e.stopPropagation(); onAddToCart(product); }} 
      className={`${currentThemeClasses} border p-0 rounded-lg shadow-sm active:scale-95 group relative`} // Add relative for badge positioning
      onMouseEnter={() => setIsHovered(true)} // Reintroduce hover for carousel
      onMouseLeave={() => setIsHovered(false)} // Reintroduce hover for carousel
    >
      <div className="relative w-full h-28 rounded-t-lg overflow-hidden"> {/* Reduced image height to h-28 */}
        {imageContent}
        {product.is_on_sale && (
          <div className="absolute top-0 left-0 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-br-lg">
            SALE
          </div>
        )}
      </div>

      <div className="p-3 text-left"> {/* Reduced padding to p-3 */}
        <h3 className="text-base font-bold text-gray-900 mb-1 leading-tight line-clamp-2">{product.name}</h3> {/* Adjusted text size to base */}
        
        <p className="text-xs text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap mb-1"> {/* Added mb-1 */}
          {product.quantity} Available &bull; {product.total_sold || 0} Sold
        </p>
        
        <p className="text-xs text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap mb-2"> {/* Added for arrival date */}
          Arrived: {formattedArrivalDate}
        </p>

        <div className="flex items-baseline justify-between">
          {product.is_on_sale ? (
            <div>
              <span className="text-lg font-bold text-red-600">${product.sale_price.toFixed(2)}</span>
              <span className="text-sm text-gray-500 line-through ml-2">${product.price.toFixed(2)}</span>
            </div>
          ) : (
            <span className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1 h-4"> {/* Reserve space for alignment */}
          {product.is_on_sale && (() => {
            const startDate = product.discount_start_date ? new Date(product.discount_start_date).toLocaleDateString() : null;
            const endDate = product.discount_end_date ? new Date(product.discount_end_date).toLocaleDateString() : null;
            let dateText = "";
            if (startDate && endDate) {
                dateText = `Sale: ${startDate} - ${endDate}`;
            } else if (startDate) {
                dateText = `Sale starts: ${startDate}`;
            } else if (endDate) {
                dateText = `Sale ends: ${endDate}`;
            } else {
                dateText = `Sale: Active`;
            }
            return dateText;
          })()}
        </p>
      </div>
    </button>
  );
});

export default ProductCard;