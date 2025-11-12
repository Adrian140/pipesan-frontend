import React from 'react';
import { Wrench, Shield, Truck, Award } from 'lucide-react';

/**
 * Props:
 * - title (string)
 * - subtitle (string)
 * - features (array of { title, description, icon? })
 *
 * Dacă nu trimiți props, folosește fallback-urile (engleză).
 */
function WhyChooseUs({
  title = 'Why Choose PipeSan for Professional Plumbing Parts',
  subtitle = 'Professional plumbing components and installation parts designed for European professionals',
  features = [
    {
      icon: Shield,
      title: 'Professional Quality Guarantee',
      description:
        'CE certified products with technical specifications and quality assurance for professional installations',
    },
    {
      icon: Truck,
      title: 'Fast European Delivery',
      description:
        'Strategic warehouse locations across Europe for rapid delivery of plumbing parts and components',
    },
    {
      icon: Wrench,
      title: 'Technical Support & Expertise',
      description:
        'Professional technical support team with expertise in plumbing installations and component specifications',
    },
    {
      icon: Award,
      title: 'Trusted by Professionals',
      description:
        'Reliable supplier with consistent quality and documentation',
    },
  ],
}) {
  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary mb-4">
            {title}
          </h2>
          <p className="text-lg sm:text-xl text-text-secondary">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((f, i) => {
            const Icon = f.icon || Shield;
            return (
              <div
                key={i}
                className="bg-gray-50 p-6 rounded-xl text-center hover:shadow-lg transition-shadow duration-200"
              >
                <Icon className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-2">
                  {f.title}
                </h3>
                <p className="text-sm sm:text-base text-text-secondary">
                  {f.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default WhyChooseUs;
