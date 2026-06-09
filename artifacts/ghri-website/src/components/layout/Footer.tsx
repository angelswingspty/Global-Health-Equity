import React from "react";
import { Link } from "wouter";
import { Facebook, Twitter, Linkedin, Instagram, Mail, Globe, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-secondary text-white py-12 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white font-bold text-lg">
                G
              </div>
              <span className="text-xl font-bold tracking-tight">GHRI Foundation</span>
            </div>
            <p className="text-sm text-secondary-foreground/80 leading-relaxed max-w-xs">
              Expanding equitable access to quality healthcare for underserved communities worldwide through telemedicine, preventive care, and AI-driven innovation.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-3 text-sm text-secondary-foreground/80">
              <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/programs" className="hover:text-primary transition-colors">Our Programs</Link></li>
              <li><Link href="/blog" className="hover:text-primary transition-colors">News & Updates</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Get Involved</h4>
            <ul className="space-y-3 text-sm text-secondary-foreground/80">
              <li><Link href="/donate" className="hover:text-primary transition-colors">Donate Now</Link></li>
              <li><Link href="/get-involved" className="hover:text-primary transition-colors">Volunteer</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Partner With Us</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Contact Info</h4>
            <ul className="space-y-3 text-sm text-secondary-foreground/80">
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <span>info.ghrif@gmail.com</span>
              </li>
              <li className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-primary shrink-0" />
                <span>www.ghrif.org</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <span className="text-left">732 S 6TH ST STE R
                Las Vegas, NV 89101</span>
              </li>
            </ul>
            <div className="flex items-center gap-4 mt-6">
              <a href="#" className="text-secondary-foreground/80 hover:text-primary transition-colors" aria-label="Facebook">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-secondary-foreground/80 hover:text-primary transition-colors" aria-label="Twitter">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-secondary-foreground/80 hover:text-primary transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-secondary-foreground/80 hover:text-primary transition-colors" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-secondary-foreground/60">
          <p>&copy; {new Date().getFullYear()} Global Health Reform Initiative Foundation. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
