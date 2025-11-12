import React from 'react';

function Certifications() {
  const certifications = [
    { name: "CE Marking", logo: "https://content-studio.biela.dev/i/content-studio/68a9b2648cd1ba15f2ff2bbc/1755966541741-68a9b2648cd1ba15f2ff2bbc/1756156913998.jpeg/ce-marking.webp" },
    { name: "ISO 9001", logo: "https://content-studio.biela.dev/i/content-studio/68a9b2648cd1ba15f2ff2bbc/1755966541741-68a9b2648cd1ba15f2ff2bbc/1756156904693.jpeg/iso-9001.webp" },
    { name: "WRAS Approved", logo: "https://content-studio.biela.dev/i/content-studio/68a9b2648cd1ba15f2ff2bbc/1755966541741-68a9b2648cd1ba15f2ff2bbc/1756156913998.jpeg/wras-approved.webp" },
    { name: "ACS Certified", logo: "https://content-studio.biela.dev/i/content-studio/68a9b2648cd1ba15f2ff2bbc/1755966541741-68a9b2648cd1ba15f2ff2bbc/1756156904693.jpeg/acs-certified.webp" },
    { name: "KTW Approved", logo: "https://content-studio.biela.dev/i/content-studio/68a9b2648cd1ba15f2ff2bbc/1755966541741-68a9b2648cd1ba15f2ff2bbc/1756156913998.jpeg/ktw-approved.webp" },
    { name: "FDA Compliant", logo: "https://content-studio.biela.dev/i/content-studio/68a9b2648cd1ba15f2ff2bbc/1755966541741-68a9b2648cd1ba15f2ff2bbc/1756156904693.jpeg/fda-compliant.webp" }
  ];

  return (
    <section className="py-12 lg:py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4">
            Quality Certifications & Standards
          </h2>
          <p className="text-sm sm:text-base text-text-secondary">
            All products meet European standards and certifications
          </p>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-6 lg:gap-8 items-center justify-items-center">
          {certifications.map((cert, index) => (
            <div key={index} className="text-center">
              <img src={cert.logo} alt={cert.name} className="w-16 h-16 mx-auto mb-2 object-contain" />
              <p className="text-xs sm:text-sm font-medium text-text-secondary">{cert.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Certifications;