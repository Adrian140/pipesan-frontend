import React from 'react';
import { Wrench, Settings, Droplets, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function FeaturedCategories() {
  const featuredCategories = [
    {
      title: 'Ball Valves',
      description: 'Professional brass ball valves with full bore design. CW617N construction, BSP/NPT threads, pressure ratings up to PN25.',
      icon: Wrench,
      color: 'from-blue-50 to-white',
      iconColor: 'text-primary',
      linkColor: 'text-primary hover:text-primary-dark',
      href: '/products?category=valves'
    },
    {
      title: 'Pipe Fittings',
      description: 'High-quality brass and stainless steel fittings. Various sizes from DN15 to DN50, with BSP and NPT thread options.',
      icon: Settings,
      color: 'from-copper/10 to-white',
      iconColor: 'text-copper',
      linkColor: 'text-copper hover:text-copper-dark',
      href: '/products?category=fittings'
    },
    {
      title: 'Flexible Hoses',
      description: 'EPDM rubber hoses with stainless steel braiding. Various lengths and diameters, suitable for hot and cold water applications.',
      icon: Droplets,
      color: 'from-steel/10 to-white',
      iconColor: 'text-steel',
      linkColor: 'text-steel hover:text-steel-dark',
      href: '/products?category=hoses'
    }
  ];

  return (
    <section className="mb-16">
      <h2 className="text-3xl font-bold text-text-primary mb-8 text-center">
        Featured Product Lines
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {featuredCategories.map((category, index) => (
          <div key={index} className={`bg-gradient-to-br ${category.color} rounded-xl p-8 text-center`}>
            <category.icon className={`w-12 h-12 ${category.iconColor} mx-auto mb-4`} />
            <h3 className="text-xl font-semibold text-text-primary mb-4">{category.title}</h3>
            <p className="text-text-secondary mb-6">
              {category.description}
            </p>
            <Link
              to={category.href}
              className={`inline-flex items-center ${category.linkColor} font-medium`}
            >
              View {category.title} <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

export default FeaturedCategories;
