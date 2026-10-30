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
  const icons = [Shield, Truck, Wrench, Award];
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-14">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary mb-4">01 — PipeSan</p>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-text-primary mb-4">
            {title}
          </h2>
          <p className="text-lg text-text-secondary">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-gray-200">
          {features.map((f, i) => {
            const Icon = f.icon || icons[i % icons.length];
            return (
              <div
                key={i}
                className="group p-8 border-r border-b border-gray-200 hover:bg-paper transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-graphite-900 flex items-center justify-center mb-6 group-hover:bg-brass-sheen transition-colors">
                  <Icon className="w-6 h-6 text-brass-light group-hover:text-graphite-950 transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
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
