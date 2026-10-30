import React, { useState } from 'react';
import { Star } from 'lucide-react';

function Testimonials({
  title = 'What Our Professional Clients Say',
  subtitle = 'Trusted by professional installers across Europe',
  testimonials = [],
}) {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const has = testimonials && testimonials.length > 0;

  return (
    <section className="py-20 lg:py-28 bg-graphite-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-14">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brass-light mb-4">04 — Clients</p>
          <h2 className="text-3xl lg:text-4xl font-extrabold mb-4">
            {title}
          </h2>
          <p className="text-lg text-gray-400">{subtitle}</p>
        </div>

        {has && (
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((item, index) => (
              <figure
                key={index}
                onMouseEnter={() => setCurrentTestimonial(index)}
                className={`rounded-2xl p-8 border transition-colors ${
                  index === currentTestimonial
                    ? 'border-brass/60 bg-white/[0.06]'
                    : 'border-white/10 bg-white/[0.03]'
                }`}
              >
                <div className="flex mb-6" aria-label={`${item.rating || 5}/5`}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-brass-light fill-current" />
                  ))}
                </div>
                <blockquote className="text-gray-200 leading-relaxed mb-8">
                  “{item.text}”
                </blockquote>
                <figcaption>
                  <p className="font-bold">{item.name}</p>
                  <p className="font-mono text-xs uppercase tracking-wider text-gray-500 mt-1">
                    {item.company}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Testimonials;
