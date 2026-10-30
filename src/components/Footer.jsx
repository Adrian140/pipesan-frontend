import React from 'react';
import { Wrench, Phone, Mail, MapPin, Award, Truck, Shield } from 'lucide-react';
import PipeSanWordmark from './brand/PipeSanWordmark';

function Footer() {
  return (
    <footer className="bg-graphite-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <PipeSanWordmark className="w-48 -ml-2" />
            </div>
            <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
              Professional plumbing parts and pipe fittings supplier for Europe. High-quality brass and stainless steel components with technical specifications, certificates and fast delivery. Serving professionals and installers since 2020.
            </p>
            <div className="flex">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="flex items-center">
                  <Award className="w-4 h-4 text-brass-light mr-2" />
                  <span className="text-sm text-gray-400">CE Certified</span>
                </div>
                <div className="flex items-center">
                  <Shield className="w-4 h-4 text-brass-light mr-2" />
                  <span className="text-sm text-gray-400">ISO 9001</span>
                </div>
                <div className="flex items-center">
                  <Truck className="w-4 h-4 text-brass-light mr-2" />
                  <span className="text-sm text-gray-400">Fast EU Delivery</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-brass-light mb-5">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <a href="mailto:contact@pipesan.eu" className="text-gray-400 hover:text-white transition-colors">contact@pipesan.eu</a>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <a href="tel:+33675116218" className="text-gray-400 hover:text-white transition-colors">+33 675 11 62 18</a>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                <span className="text-gray-400">
                  Sat Leamna de jos, Comuna Bucovat, nr.159 A<br />
                  Region: Dolj, România<br />
                  VAT: RO39535603
                </span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-brass-light mb-5">Quick Links</h3>
            <div className="space-y-2">
              <a href="/categories" className="block text-gray-400 hover:text-white transition-colors">
                Product Categories
              </a>
              <a href="/technical-specs" className="block text-gray-400 hover:text-white transition-colors">
                Technical Specifications
              </a>
              <a href="/support" className="block text-gray-400 hover:text-white transition-colors">
                Technical Support
              </a>
              <a href="/terms" className="block text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="/privacy-policy" className="block text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-white/10 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
            <span>© {new Date().getFullYear()} PipeSan · VAT RO39535603</span>
            <span>
            AI vibe coded development by{' '}
            <a 
              href="https://biela.dev/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-brass-light transition-colors"
            >
              Biela.dev
            </a>
            , powered by{' '}
            <a 
              href="https://teachmecode.ae/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-brass-light transition-colors"
            >
              TeachMeCode® Institute
            </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
