
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Pill, 
  Package, 
  FileText, 
  Receipt, 
  BarChart3, 
  Users, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white font-['Inter']">
      {/* 1. Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-crimson to-pinkish rounded-xl flex items-center justify-center text-white shadow-lg shadow-crimson/20">
              <Pill size={24} />
            </div>
            <span className="text-lg font-bold text-slate-800 tracking-tight">PharmaFlow Pro</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollToSection('home')} className="text-xs font-bold text-slate-500 hover:text-crimson transition-colors">Home</button>
            <button onClick={() => scrollToSection('features')} className="text-xs font-bold text-slate-500 hover:text-crimson transition-colors">Features</button>
            <button onClick={() => scrollToSection('about')} className="text-xs font-bold text-slate-500 hover:text-crimson transition-colors">About</button>
            <button onClick={() => scrollToSection('contact')} className="text-xs font-bold text-slate-500 hover:text-crimson transition-colors">Contact</button>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/customer-login" className="text-xs font-bold text-slate-600 hover:text-crimson transition-colors">Login</Link>
            <Link to="/customer-register" className="px-5 py-2 bg-crimson text-white rounded-lg text-xs font-bold hover:brightness-110 transition-all shadow-md">Register</Link>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section id="home" className="pt-32 pb-16 px-6 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6 animate-in fade-in slide-in-from-left duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose/10 rounded-full text-crimson text-[10px] font-bold tracking-wider border border-rose/10">
              <ShieldCheck size={12} /> Enterprise grade security
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
              Smart & efficient <br />
              <span className="text-crimson">Pharmacy management</span> system
            </h1>
            <p className="text-sm text-slate-500 font-medium max-w-lg leading-relaxed tracking-tight">
              A complete solution to manage medicines, prescriptions, billing, and reports efficiently in one secure platform.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/customer-login" className="px-6 py-2.5 bg-crimson text-white rounded-lg font-bold text-sm tracking-wide flex items-center gap-2 hover:brightness-110 transition-all shadow-md">
                Login to continue <ArrowRight size={16} />
              </Link>
              <Link to="/customer-register" className="px-6 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-lg font-bold text-sm tracking-wide hover:bg-slate-50 transition-all">
                Create account
              </Link>
            </div>
          </div>

          <div className="relative animate-in fade-in slide-in-from-right duration-1000">
            <div className="absolute -top-20 -right-20 w-[500px] h-[500px] bg-rose/10 rounded-full blur-[120px] opacity-50"></div>
            <div className="relative bg-white rounded-[4rem] shadow-2xl border border-slate-100 p-10 overflow-hidden">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="h-44 bg-slate-50 rounded-[2.5rem] p-8 flex flex-col justify-between border border-slate-100">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-crimson border border-slate-100">
                      <Pill size={24} />
                    </div>
                    <div className="space-y-2">
                      <div className="h-2.5 w-16 bg-crimson/20 rounded-full"></div>
                      <div className="h-2.5 w-24 bg-slate-200 rounded-full"></div>
                    </div>
                  </div>
                  <div className="h-64 bg-crimson rounded-[2.5rem] p-8 flex flex-col justify-between text-white shadow-xl shadow-crimson/20">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                      <BarChart3 size={24} />
                    </div>
                    <div className="space-y-3">
                      <div className="h-3.5 w-28 bg-white/40 rounded-full"></div>
                      <div className="h-10 w-20 bg-white/20 rounded-2xl"></div>
                    </div>
                  </div>
                </div>
                <div className="space-y-6 pt-12">
                  <div className="h-64 bg-coral/10 rounded-[2.5rem] p-8 flex flex-col justify-between text-coral shadow-sm border border-coral/20">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                      <Users size={24} />
                    </div>
                    <div className="space-y-3">
                      <div className="h-3.5 w-24 bg-coral/20 rounded-full"></div>
                      <div className="h-3.5 w-16 bg-coral/10 rounded-full"></div>
                    </div>
                  </div>
                  <div className="h-44 bg-rose/10 rounded-[2.5rem] p-8 flex flex-col justify-between border border-rose/10">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-crimson border border-rose/10">
                      <Receipt size={24} />
                    </div>
                    <div className="space-y-2">
                      <div className="h-2.5 w-20 bg-crimson/20 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-16 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-1">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Powerful features</h2>
            <p className="text-slate-500 font-medium tracking-wide text-xs">Everything you need to run a modern pharmacy.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <Pill />, title: "Medicine management", desc: "Easily catalog, categorize, and manage your entire medicine database with detailed specifications." },
              { icon: <Package />, title: "Inventory tracking", desc: "Real-time stock monitoring, low stock alerts, and automated reordering suggestions." },
              { icon: <FileText />, title: "Prescription handling", desc: "Digital prescription uploads, verification workflow, and automated medicine mapping." },
              { icon: <Receipt />, title: "Billing system", desc: "Fast and secure checkout process with automated invoice generation and tax calculations." },
              { icon: <BarChart3 />, title: "Reports & analytics", desc: "Comprehensive business intelligence with sales trends, financial reports, and inventory insights." },
              { icon: <Users />, title: "Role-based access", desc: "Secure access control for Admins, Pharmacists, Staff, and Customers with personalized dashboards." }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-crimson/20 transition-all group">
                <div className="w-10 h-10 bg-slate-50 text-crimson rounded-lg flex items-center justify-center mb-4 group-hover:bg-crimson group-hover:text-white transition-all border border-slate-100">
                  {React.cloneElement(feature.icon as React.ReactElement, { size: 20 })}
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2 tracking-tight">{feature.title}</h3>
                <p className="text-slate-500 text-xs font-medium leading-relaxed tracking-tight">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="aspect-square bg-slate-50 rounded-2xl flex items-center justify-center p-6 border border-slate-100">
              <div className="grid grid-cols-2 gap-4 w-full h-full">
                <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col justify-center items-center text-center space-y-1 border border-slate-100">
                  <CheckCircle2 className="text-crimson" size={32} />
                  <p className="text-xl font-bold text-slate-800 tracking-tight">99.9%</p>
                  <p className="text-[9px] font-bold text-slate-400 tracking-wider">Accuracy rate</p>
                </div>
                <div className="bg-crimson rounded-xl shadow-md p-4 flex flex-col justify-center items-center text-center space-y-1 text-white mt-6">
                  <ShieldCheck size={32} />
                  <p className="text-xl font-bold tracking-tight">Secure</p>
                  <p className="text-[9px] font-bold text-white/60 tracking-wider">Data encryption</p>
                </div>
                <div className="bg-papaya rounded-xl shadow-sm p-4 flex flex-col justify-center items-center text-center space-y-1 text-crimson border border-papaya">
                  <Users size={32} />
                  <p className="text-xl font-bold tracking-tight">500+</p>
                  <p className="text-[9px] font-bold text-crimson/60 tracking-wider">Active clients</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col justify-center items-center text-center space-y-1 mt-6 border border-slate-100">
                  <BarChart3 className="text-crimson" size={32} />
                  <p className="text-xl font-bold text-slate-800 tracking-tight">Live</p>
                  <p className="text-[9px] font-bold text-slate-400 tracking-wider">Analytics</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
              Digitizing pharmacy <br />
              <span className="text-crimson">operations worldwide</span>
            </h2>
            <p className="text-base text-slate-500 font-medium leading-relaxed tracking-tight">
              PharmaFlow Pro is a comprehensive digital ecosystem designed specifically for the pharmaceutical industry.
            </p>
            <div className="space-y-3">
              {[
                "Automated inventory management and stock alerts",
                "Secure prescription verification workflow",
                "Advanced financial reporting and tax tracking",
                "Patient-centric order and refill management"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 group">
                  <div className="w-5 h-5 bg-rose/10 text-crimson rounded-full flex items-center justify-center group-hover:bg-crimson group-hover:text-white transition-all">
                    <CheckCircle2 size={12} />
                  </div>
                  <span className="text-slate-700 font-bold text-xs tracking-tight">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto bg-rose/5 rounded-2xl p-10 md:p-12 text-center relative overflow-hidden border border-rose/10">
          <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
            <Pill className="absolute -top-10 -left-10 w-40 h-40 rotate-12 text-crimson" />
            <Package className="absolute bottom-10 right-10 w-48 h-48 -rotate-12 text-crimson" />
          </div>
          <div className="relative z-10 space-y-6">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight leading-tight text-slate-900">
              Ready to transform your pharmacy?
            </h2>
            <p className="text-slate-500 font-medium text-base max-w-2xl mx-auto tracking-tight">
              Login to access your personalized dashboard and start managing your pharmacy with precision and ease.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/customer-login" className="px-8 py-3 bg-crimson text-white rounded-lg font-bold text-base hover:brightness-110 transition-all shadow-md">
                Login now
              </Link>
              <Link to="/customer-register" className="px-8 py-3 bg-white text-slate-800 border border-slate-200 rounded-lg font-bold text-base hover:bg-slate-50 transition-all">
                Register account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer id="contact" className="bg-white pt-16 pb-8 px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10 mb-16">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-crimson rounded-lg flex items-center justify-center text-white shadow-md">
                <Pill size={18} />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-800">PharmaFlow Pro</span>
            </div>
            <p className="text-slate-500 text-xs font-medium leading-relaxed">
              The world's most advanced pharmacy management platform. Empowering healthcare providers with smart technology.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center hover:bg-crimson hover:text-white transition-all text-slate-400 border border-slate-100"><Facebook size={16} /></a>
              <a href="#" className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center hover:bg-crimson hover:text-white transition-all text-slate-400 border border-slate-100"><Twitter size={16} /></a>
              <a href="#" className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center hover:bg-crimson hover:text-white transition-all text-slate-400 border border-slate-100"><Instagram size={16} /></a>
              <a href="#" className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center hover:bg-crimson hover:text-white transition-all text-slate-400 border border-slate-100"><Linkedin size={16} /></a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold tracking-wider text-crimson">Quick Links</h4>
            <ul className="space-y-3 text-slate-500 text-xs font-bold">
              <li><button onClick={() => scrollToSection('home')} className="hover:text-crimson transition-colors">Home</button></li>
              <li><button onClick={() => scrollToSection('features')} className="hover:text-crimson transition-colors">Features</button></li>
              <li><button onClick={() => scrollToSection('about')} className="hover:text-crimson transition-colors">About us</button></li>
              <li><button onClick={() => scrollToSection('contact')} className="hover:text-crimson transition-colors">Contact</button></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold tracking-wider text-crimson">Legal</h4>
            <ul className="space-y-3 text-slate-500 text-xs font-bold">
              <li><a href="#" className="hover:text-crimson transition-colors">Privacy policy</a></li>
              <li><a href="#" className="hover:text-crimson transition-colors">Terms of service</a></li>
              <li><a href="#" className="hover:text-crimson transition-colors">Cookie policy</a></li>
              <li><a href="#" className="hover:text-crimson transition-colors">Compliance</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold tracking-wider text-crimson">Contact Info</h4>
            <ul className="space-y-3 text-slate-500 text-xs font-medium">
              <li className="flex items-center gap-2">
                <MapPin size={16} className="text-pinkish" />
                <span className="text-slate-600">123 Medical Plaza, Healthcare City</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-pinkish" />
                <span className="text-slate-600">+1 (555) 000-PHARMA</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-pinkish" />
                <span className="text-slate-600">support@pharmaflowpro.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-[10px] font-bold tracking-wider">
            © 2024 PharmaFlow Pro. All rights reserved.
          </p>
          <div className="flex gap-6 text-slate-400 text-[9px] font-bold tracking-wider">
            <span>System status: <span className="text-green-500">Operational</span></span>
            <span>Version: 2.4.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
