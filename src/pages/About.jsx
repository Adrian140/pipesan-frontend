import React from 'react';
import { Award, Users, Clock, Shield } from 'lucide-react';

function About() {
  const stats = [
    { number: "4+", label: "Years Experience", icon: Clock },
    { number: "1000+", label: "Orders Processed", icon: Award },
    { number: "50+", label: "Happy Clients", icon: Users },
    { number: "24h", label: "Average Turnaround", icon: Shield }
  ];

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
            About PipeSan - Professional Plumbing Parts Supplier
          </h1>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            European supplier of professional plumbing parts and pipe fittings. High-quality brass and stainless steel components with technical specifications, certificates and fast delivery. Serving professionals and installers since 2020.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          {/* Story */}
          <div>
            <h2 className="text-3xl font-bold text-text-primary mb-6">Our Story</h2>
            <div className="space-y-4 text-text-secondary">
              <p>
                PipeSan was founded with a simple mission: to provide European professionals with reliable, high-quality plumbing parts and components. Located strategically in Romania, we serve as the perfect hub for EU-wide distribution.
              </p>
              <p>
                Our team brings extensive experience in plumbing installations and component specifications. Having worked with professionals across Europe, we understood the need for a supplier that combines quality, technical expertise, and fast delivery.
              </p>
              <p>
                Today, we supply thousands of professional installers, contractors and distributors across Europe. We maintain our commitment to quality while ensuring every product meets European standards and certifications.
              </p>
              <p>
                We believe in building long-term partnerships with our clients, providing not just products but also technical support and expertise to help European professionals succeed in their installation projects.
              </p>
            </div>
          </div>

          {/* Image Placeholder */}
          <div className="bg-gray-200 rounded-xl h-96 flex items-center justify-center">
            <div className="text-center">
              <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Warehouse & Operations</p>
              <p className="text-sm text-gray-400">Professional parts distribution center</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <section className="mb-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                <div className="text-3xl font-bold text-text-primary mb-2">{stat.number}</div>
                <div className="text-text-secondary">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Values */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-text-primary mb-12 text-center">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-4">Quality & Reliability</h3>
              <p className="text-text-secondary">
                We understand that quality is crucial in professional installations. Every product undergoes thorough quality control and meets European standards.
              </p>
            </div>
            <div className="text-center">
              <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-4">Technical Expertise</h3>
              <p className="text-text-secondary">
                Our team provides comprehensive technical support, helping you select the right components for your specific installation requirements.
              </p>
            </div>
            <div className="text-center">
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-4">Partnership & Support</h3>
              <p className="text-text-secondary">
                We're not just a supplier – we're your partner in success. Our team provides ongoing support and guidance for your professional projects.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-12">
            <h2 className="text-3xl font-bold text-text-primary mb-6">
              Ready to Partner with Us?
            </h2>
            <p className="text-xl text-text-secondary mb-8">
              Join the growing community of successful European professionals who trust us with their plumbing parts supply.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-primary text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary-dark transition-colors">
                Get Started Today
              </button>
              <a
                href="https://wa.me/33675111618"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-accent text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-accent-dark transition-colors"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default About;
