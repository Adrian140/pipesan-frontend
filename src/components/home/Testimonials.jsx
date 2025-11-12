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
    <section className="py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary mb-4">
            {title}
          </h2>
          <p className="text-lg sm:text-xl text-text-secondary">{subtitle}</p>
        </div>

        {has && (
          <>
            <div className="max-w-4xl mx-auto">
              <div className="bg-gray-50 p-6 sm:p-8 rounded-xl text-center">
                <div className="flex justify-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-base sm:text-lg text-text-secondary mb-6 italic">
                  "{testimonials[currentTestimonial].text}"
                </p>
                <div>
                  <p className="text-sm sm:text-base font-semibold text-text-primary">
                    {testimonials[currentTestimonial].name}
                  </p>
                  <p className="text-sm sm:text-base text-text-secondary">
                    {testimonials[currentTestimonial].company}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-6 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentTestimonial ? 'bg-primary' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default Testimonials;
