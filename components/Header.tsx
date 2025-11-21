
import React from 'react';
import { Language } from '../types';

interface HeaderProps {
  theme: string;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, language, setLanguage, t }) => {
  return (
    <header className="flex-shrink-0 bg-white dark:bg-secondary-900 shadow-sm p-4 flex justify-between items-center border-b border-secondary-200 dark:border-secondary-800">
       <h2 className="text-lg font-semibold text-secondary-800 dark:text-secondary-100 hidden sm:block">{t('dashboard')}</h2>
      <div className="flex items-center space-x-4">
        {/* Language Selector */}
        <div className="relative">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="appearance-none bg-secondary-100 dark:bg-secondary-800 border border-secondary-300 dark:border-secondary-700 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="pt">{t('portuguese')}</option>
            <option value="en">{t('english')}</option>
            <option value="es">{t('spanish')}</option>
          </select>
        </div>

        {/* Theme Toggler */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-secondary-900"
        >
          {theme === 'light' ? (
            // Moon Icon
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          ) : (
            // Sun Icon
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 14.95a1 1 0 010-1.414l.707-.707a1 1 0 011.414 1.414l-.707.707a1 1 0 01-1.414 0zM3 11a1 1 0 100-2H2a1 1 0 100 2h1z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
