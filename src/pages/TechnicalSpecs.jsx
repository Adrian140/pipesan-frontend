import React from 'react';
import { FileText, Download, Settings, Wrench, Info, CheckCircle } from 'lucide-react';
import TechnicalDocuments from '../components/TechnicalDocuments';

function TechnicalSpecs() {
  const specifications = [
    {
      category: 'Ball Valves',
      icon: Wrench,
      specs: [
        { parameter: 'Nominal Diameter', values: 'DN15, DN20, DN25, DN32, DN40, DN50' },
        { parameter: 'Material', values: 'CW617N Brass, 316L Stainless Steel' },
        { parameter: 'Pressure Rating', values: 'PN16 (16 bar), PN25 (25 bar), PN40 (40 bar)' },
        { parameter: 'Temperature Range', values: '-20°C to +150°C' },
        { parameter: 'Thread Type', values: 'BSP (British Standard Pipe), NPT (National Pipe Thread)' },
        { parameter: 'Certifications', values: 'CE, WRAS, ACS, KTW' }
      ]
    },
    {
      category: 'Pipe Fittings',
      icon: Settings,
      specs: [
        { parameter: 'Nominal Diameter', values: 'DN15 to DN100' },
        { parameter: 'Material', values: 'CW617N Brass, 316L SS, Carbon Steel' },
        { parameter: 'Pressure Rating', values: 'PN10, PN16, PN25, PN40' },
        { parameter: 'Temperature Range', values: '-40°C to +200°C' },
        { parameter: 'Connection Type', values: 'Threaded, Welded, Compression' },
        { parameter: 'Standards', values: 'EN 1254, DIN 2999, ISO 228' }
      ]
    },
    {
      category: 'Flexible Hoses',
      icon: Info,
      specs: [
        { parameter: 'Inner Diameter', values: '1/2", 3/4", 1", 1 1/4", 1 1/2"' },
        { parameter: 'Material', values: 'EPDM Rubber + SS Braid' },
        { parameter: 'Pressure Rating', values: 'PN10 (10 bar), PN16 (16 bar)' },
        { parameter: 'Temperature Range', values: '-30°C to +110°C' },
        { parameter: 'Length Options', values: '300mm, 500mm, 750mm, 1000mm, Custom' },
        { parameter: 'End Connections', values: 'BSP Male/Female, NPT, Compression' }
      ]
    }
  ];

  const documents = [
    {
      title: 'Complete Technical Catalog 2024',
      description: 'Full product specifications, dimensions and technical data',
      type: 'PDF',
      size: '15.2 MB',
      pages: 156,
      languages: ['EN', 'FR', 'DE', 'IT', 'ES']
    },
    {
      title: 'Installation Guidelines',
      description: 'Professional installation procedures and best practices',
      type: 'PDF',
      size: '8.7 MB',
      pages: 89,
      languages: ['EN', 'FR', 'DE']
    },
    {
      title: 'CE Certificates & Declarations',
      description: 'Complete certification documentation for all products',
      type: 'PDF',
      size: '12.4 MB',
      pages: 234,
      languages: ['EN', 'FR']
    },
    {
      title: 'Material Safety Data Sheets',
      description: 'MSDS for all materials used in our products',
      type: 'PDF',
      size: '6.1 MB',
      pages: 67,
      languages: ['EN', 'FR', 'DE', 'IT', 'ES']
    }
  ];

  const standards = [
    {
      standard: 'EN 1254',
      description: 'Copper and copper alloys - Plumbing fittings',
      scope: 'Brass fittings, valves, connectors'
    },
    {
      standard: 'DIN 2999',
      description: 'ISO metric screw threads - Basic profile',
      scope: 'Thread specifications for pipe connections'
    },
    {
      standard: 'ISO 228',
      description: 'Pipe threads where pressure-tight joints are not made on the threads',
      scope: 'BSP thread specifications'
    },
    {
      standard: 'EN 10088',
      description: 'Stainless steels - List of stainless steels',
      scope: 'Stainless steel material specifications'
    }
  ];

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
            Technical Specifications & Standards
          </h1>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            Complete technical documentation for all our professional plumbing parts and components. 
            Detailed specifications, certifications and installation guidelines for professional use.
          </p>
        </div>

        {/* Technical Specifications */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-text-primary mb-12 text-center">
            Product Specifications
          </h2>
          <div className="space-y-8">
            {specifications.map((spec, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-copper p-6">
                  <div className="flex items-center text-white">
                    <spec.icon className="w-8 h-8 mr-4" />
                    <h3 className="text-2xl font-bold">{spec.category}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {spec.specs.map((item, specIndex) => (
                      <div key={specIndex} className="flex justify-between items-start py-3 border-b border-gray-100">
                        <span className="font-medium text-text-primary w-1/3">{item.parameter}:</span>
                        <span className="text-text-secondary w-2/3 text-right">{item.values}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Technical Documents */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-text-primary mb-12 text-center">
            Technical Documentation
          </h2>
          {documents.map((doc, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-text-primary">{doc.title}</h3>
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="text-sm text-text-secondary">{doc.type}</span>
                  </div>
                </div>
                <p className="text-text-secondary mb-4">{doc.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-text-secondary mb-4">
                  <div>
                    <span className="font-medium">Size:</span> {doc.size}
                  </div>
                  <div>
                    <span className="font-medium">Pages:</span> {doc.pages}
                  </div>
                  <div>
                    <span className="font-medium">Languages:</span> {doc.languages.join(', ')}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <button className="text-primary hover:text-primary-dark font-medium text-sm">
                    Download PDF
                  </button>
                </div>
            </div>
          ))}
        </section>

        {/* Standards & Compliance */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-text-primary mb-12 text-center">
            European Standards & Compliance
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="space-y-6">
              {standards.map((standard, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-1">{standard.standard}</h3>
                    <p className="text-text-secondary mb-2">{standard.description}</p>
                    <p className="text-sm text-text-light">Applies to: {standard.scope}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default TechnicalSpecs;