import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import { translations } from './constants';
import { Language } from './types';
import { ProjectProvider } from './contexts/ProjectContext';

function App() {
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState<Language>('pt');
  const [activeTab, setActiveTab] = useState('data-input');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  const t = useMemo(() => {
    return (key: keyof typeof translations.en) => translations[language][key] || key;
  }, [language]);


  return (
    <ProjectProvider>
      <div className="flex h-screen bg-secondary-100 dark:bg-secondary-950 text-secondary-800 dark:text-secondary-200 font-sans">
        <Sidebar t={t} activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            theme={theme} 
            toggleTheme={toggleTheme} 
            language={language} 
            setLanguage={setLanguage}
            t={t}
          />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-secondary-100 dark:bg-secondary-950 p-4 sm:p-6 lg:p-8">
            <Dashboard t={t} activeTab={activeTab} />
          </main>
        </div>
      </div>
    </ProjectProvider>
  );
}

export default App;