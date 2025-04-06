import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import logo from "/logo.png"
import { Link } from 'react-router-dom';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'id', name: 'Indonesia' }
  ];

  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);

  useEffect(() => {
    i18n.changeLanguage('en');

    localStorage.setItem('language', 'en');
  }, []); 

  const handleLanguageSelect = (lang) => {
    setSelectedLanguage(lang);
    i18n.changeLanguage(lang.code);
    localStorage.setItem('language', lang.code);
    setIsLanguageOpen(false);
  };
  return (
    <nav className="fixed top-0 left-0 w-full bg-black/30 backdrop-blur-xl border-b border-white/10 z-50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo - Link to Home */}
        <Link to="/" className="flex items-center space-x-3 group">
          <img 
            src={logo}
            alt="BioSecureLand Logo" 
            className="w-14 h-10 object-contain transition-transform group-hover:scale-105" 
          />
          <h1 className="text-2xl font-bold text-white tracking-tight hidden md:block opacity-90 group-hover:opacity-100 transition-opacity">
            {t('navbar.title')}
          </h1>
        </Link>

        {/* Desktop Navigation - Centered */}
        <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center space-x-8">
          <Link 
            to="/maps" 
            className="text-white/70 hover:text-white transition-colors font-medium text-lg relative group"
          >
            {t('navbar.maps')}
            <span className="absolute bottom-[-4px] left-0 w-0 h-0.5 bg-white transition-all group-hover:w-full"></span>
          </Link>
          <Link 
            to="/dashboard" 
            className="text-white/70 hover:text-white transition-colors font-medium text-lg relative group"
          >
            {t('navbar.dashboard')}
            <span className="absolute bottom-[-4px] left-0 w-0 h-0.5 bg-white transition-all group-hover:w-full"></span>
          </Link>
        </div>

        {/* Right Side Navigation */}
        <div className="flex items-center space-x-4">
          {/* Language Dropdown */}
          <div className="relative hidden md:block">
            <button 
              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
              className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors"
            >
              <i className="fas fa-globe text-lg"></i>
              <span>{selectedLanguage.name}</span>
            </button>
            {isLanguageOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-black/80 backdrop-blur-lg shadow-lg rounded-md border border-white/10">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang)}
                    className={`w-full text-left px-4 py-2 hover:bg-white/10 text-white/90 ${
                      selectedLanguage.code === lang.code ? 'bg-white/20' : ''
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative hidden md:block">
            <input 
              type="text" 
              placeholder={t('navbar.search')}
              className="pl-8 pr-3 py-2 bg-white/10 text-white border border-white/20 rounded-full w-48 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all placeholder-white/50"
            />
            <i className="fas fa-search absolute left-3 top-3.5 text-white/50"></i>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white/70 hover:text-white"
            >
              {isMobileMenuOpen 
                ? <i className="fas fa-times text-2xl"></i> 
                : <i className="fas fa-bars text-2xl"></i>}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-black/80 backdrop-blur-lg absolute top-full left-0 w-full shadow-md">
          <div className="container mx-auto px-6 py-6 space-y-4">
            <Link 
              to="/maps" 
              className="block text-white/70 hover:text-white text-lg py-2 border-b border-white/10"
            >
              {t('navbar.maps')}
            </Link>
            <Link 
              to="/dashboard" 
              className="block text-white/70 hover:text-white text-lg py-2 border-b border-white/10"
            >
              {t('navbar.dashboard')}
            </Link>
            
            {/* Mobile Language Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                className="flex items-center space-x-2 text-white/70 hover:text-white text-lg py-2 w-full"
              >
                <i className="fas fa-globe text-lg"></i>
                <span>{selectedLanguage.name}</span>
              </button>
              {isLanguageOpen && (
                <div className="mt-2 space-y-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang)}
                      className={`w-full text-left px-4 py-2 hover:bg-white/10 text-white/90 ${
                        selectedLanguage.code === lang.code ? 'bg-white/20' : ''
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Search Bar */}
            <div className="relative mt-4">
              <input 
                type="text" 
                placeholder={t('navbar.search')}
                className="w-full pl-8 pr-3 py-2 bg-white/10 text-white border border-white/20 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50 transition-all placeholder-white/50"
              />
              <i className="fas fa-search absolute left-3 top-3.5 text-white/50"></i>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;