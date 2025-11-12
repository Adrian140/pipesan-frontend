import React from 'react';

function Section({ 
  children, 
  className = "", 
  background = "white",
  padding = "py-16 lg:py-20",
  maxWidth = "max-w-7xl"
}) {
  const backgroundClasses = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    primary: 'bg-primary',
    gradient: 'bg-gradient-to-br from-blue-50 to-white'
  };

  return (
    <section className={`${backgroundClasses[background]} ${padding} ${className}`}>
      <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
        {children}
      </div>
    </section>
  );
}

export default Section;
