import React, { useState } from 'react';
import { Wrench } from 'lucide-react';

function LogoComponent({ className = "w-20 h-20" }) {
  const [imageError, setImageError] = useState(false);
  
  const logoUrl = "https://content-studio.biela.dev/i/content-studio/68a9b2648cd1ba15f2ff2bbc/1755966541741-68a9b2648cd1ba15f2ff2bbc/1756151478743.png/chatgpt-image-25-aug-2025-11_07_46.webp";
  
  const handleImageError = () => {
    setImageError(true);
  };

  // If image fails to load, show fallback
  if (imageError) {
    return (
      <div className={`${className} bg-gradient-to-br from-primary to-copper rounded-lg flex items-center justify-center`}>
        <Wrench className="w-12 h-12 text-white" />
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt="PipeSan Logo"
      className={`${className} object-contain`}
      onError={handleImageError}
    />
  );
}

export default LogoComponent;
