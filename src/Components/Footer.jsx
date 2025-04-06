import React from 'react';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-6 grid md:grid-cols-4 gap-8">
        <div>
          <h4 className="text-xl font-bold mb-4">
            {t('footer.companyName')}
          </h4>
          <p className="text-gray-400">
            {t('footer.companyDescription')}
          </p>
        </div>
        <div>
          <h4 className="text-xl font-bold mb-4">
            {t('footer.quickLinks.title')}
          </h4>
          <ul className="space-y-2">
            <li>
              <a href="/" className="hover:text-blue-400 transition-colors">
                {t('footer.quickLinks.home')}
              </a>
            </li>
            <li>
              <a href="/products" className="hover:text-blue-400 transition-colors">
                {t('footer.quickLinks.products')}
              </a>
            </li>
            <li>
              <a href="/solutions" className="hover:text-blue-400 transition-colors">
                {t('footer.quickLinks.solutions')}
              </a>
            </li>
            <li>
              <a href="/contact" className="hover:text-blue-400 transition-colors">
                {t('footer.quickLinks.contact')}
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-xl font-bold mb-4">
            {t('footer.connect.title')}
          </h4>
          <div className="flex space-x-4">
            <a 
              href="#" 
              aria-label={t('footer.connect.twitter')}
              className="text-2xl hover:text-blue-400 transition-colors"
            >
              <i className="fab fa-twitter"></i>
            </a>
            <a 
              href="#" 
              aria-label={t('footer.connect.linkedin')}
              className="text-2xl hover:text-blue-400 transition-colors"
            >
              <i className="fab fa-linkedin"></i>
            </a>
            <a 
              href="#" 
              aria-label={t('footer.connect.github')}
              className="text-2xl hover:text-blue-400 transition-colors"
            >
              <i className="fab fa-github"></i>
            </a>
          </div>
        </div>
        <div>
          <h4 className="text-xl font-bold mb-4">
            {t('footer.newsletter.title')}
          </h4>
          <form className="flex">
            <input
              type="email"
              placeholder={t('footer.newsletter.placeholder')}
              className="w-full px-4 py-2 rounded-l-lg bg-gray-800 text-white"
            />
            <button
              type="submit"
              className="bg-blue-500 px-4 py-2 rounded-r-lg hover:bg-blue-600 transition-colors"
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </form>
        </div>
      </div>
      <div className="text-center mt-8 border-t border-gray-800 pt-6">
        <p>
          {t('footer.copyright', { year: currentYear })}
        </p>
      </div>
    </footer>
  );
};

export default Footer;