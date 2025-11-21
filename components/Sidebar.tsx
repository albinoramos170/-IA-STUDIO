
import React, { useContext, useState, useEffect, useRef } from 'react';
import DocumentIcon from './icons/DocumentIcon';
import TableCellsIcon from './icons/TableCellsIcon';
import CalculatorIcon from './icons/CalculatorIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import ClipboardIcon from './icons/ClipboardIcon';
import DocumentPlusIcon from './icons/DocumentPlusIcon';
import ChartScatterIcon from './icons/ChartScatterIcon';
import PresentationChartLineIcon from './icons/PresentationChartLineIcon';
import MapIcon from './icons/MapIcon';
import ChartPieIcon from './icons/ChartPieIcon';
import { ProjectContext } from '../contexts/ProjectContext';
import FolderIcon from './icons/FolderIcon';
import TrashIcon from './icons/TrashIcon';
import PencilSquareIcon from './icons/PencilSquareIcon';

interface SidebarProps {
  t: (key: string) => string;
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ t, activeTab, setActiveTab }) => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("Sidebar must be used within a ProjectProvider");
  const { 
    startNewProject, 
    projects, 
    activeProjectId, 
    loadProject, 
    deleteProject,
    isDirty,
    saveProjectDetails,
    discardChanges
  } = context;

  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProjectMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNavigation = (id: string) => {
    if (activeTab === id) return;
    if (isDirty) {
      setPendingTab(id);
      setShowConfirm(true);
    } else {
      setActiveTab(id);
    }
  };

  const handleConfirmSave = async () => {
      await saveProjectDetails();
      setShowConfirm(false);
      if (pendingTab) setActiveTab(pendingTab);
  };

  const handleConfirmDiscard = () => {
      discardChanges();
      setShowConfirm(false);
      if (pendingTab) setActiveTab(pendingTab);
  };

  const handleNewProject = () => {
      if (isDirty) {
        if (window.confirm(t('confirmNavigation'))) {
            discardChanges();
        } else {
            return;
        }
      }
    startNewProject();
    setActiveTab('project-setup');
  };

  const handleDeleteProject = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (window.confirm(`${t('confirmDelete')} "${name}"?`)) {
      deleteProject(id);
    }
  };

  const navItems = [
    { id: 'data-input', label: t('dataInput'), icon: <TableCellsIcon className="w-5 h-5" /> },
    { id: 'reserve-analysis', label: t('reserveAnalysis'), icon: <CalculatorIcon className="w-5 h-5" /> },
    { id: 'graphical-analysis', label: t('graphicalAnalysis'), icon: <ChartScatterIcon className="w-5 h-5" /> },
    { id: 'comparison-blocks', label: t('comparisonBlocks'), icon: <PresentationChartLineIcon className="w-5 h-5" /> },
    { id: 'financial-analysis', label: t('financialAnalysis'), icon: <ChartBarIcon className="w-5 h-5" /> },
    { id: 'heatmap', label: t('heatmap'), icon: <MapIcon className="w-5 h-5" /> },
    { id: 'statistics', label: t('statistics'), icon: <ChartPieIcon className="w-5 h-5" /> },
    { id: 'ai-report', label: t('aiReport'), icon: <ClipboardIcon className="w-5 h-5" /> },
  ];

  const activeProjectName = projects.find(p => p.id === activeProjectId)?.name || t('newProject');

  return (
    <aside className="w-64 bg-secondary-50 dark:bg-secondary-900 shadow-md flex-shrink-0 hidden md:flex md:flex-col relative">
      <div className="flex items-center justify-center h-20 border-b border-secondary-200 dark:border-secondary-800 mb-4">
        <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">MineCalc Pro AR7</h1>
      </div>
      
      {/* Project Management Dropdown */}
      <div className="px-4 mb-2 relative" ref={menuRef}>
         <button
           onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
           className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 shadow-sm hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
        >
            <div className="flex items-center overflow-hidden">
                <FolderIcon className="w-5 h-5 text-primary-500 mr-2.5 flex-shrink-0" />
                <span className="truncate text-sm font-semibold text-secondary-700 dark:text-secondary-200">{activeProjectName}</span>
            </div>
            <svg className={`w-4 h-4 text-secondary-500 transition-transform duration-200 ${isProjectMenuOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </button>

        {isProjectMenuOpen && (
            <div className="absolute left-4 right-4 top-full mt-2 z-20 bg-white dark:bg-secondary-800 rounded-lg shadow-xl border border-secondary-200 dark:border-secondary-700 max-h-72 overflow-y-auto animate-fade-in">
                <button
                    onClick={() => {
                        handleNewProject();
                        setIsProjectMenuOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-3 text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 font-medium transition-colors sticky top-0 bg-white dark:bg-secondary-800 border-b border-secondary-100 dark:border-secondary-700"
                >
                    <DocumentPlusIcon className="w-4 h-4 mr-2" />
                    {t('newProject')}
                </button>
                <button
                    onClick={() => {
                        handleNavigation('project-setup');
                        setIsProjectMenuOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-3 text-sm text-secondary-600 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700/50 font-medium transition-colors border-b border-secondary-100 dark:border-secondary-700"
                >
                    <PencilSquareIcon className="w-4 h-4 mr-2" />
                    {t('projectDetails')}
                </button>
                <div className="py-1">
                {projects.map(proj => (
                    <div key={proj.id} className="flex items-center justify-between hover:bg-secondary-50 dark:hover:bg-secondary-700 px-2 group">
                        <button
                            onClick={() => {
                                if (activeProjectId !== proj.id) {
                                     if (isDirty) {
                                        if (!window.confirm(t('confirmNavigation'))) return;
                                        discardChanges();
                                     }
                                     loadProject(proj.id);
                                }
                                setIsProjectMenuOpen(false);
                            }}
                            className={`flex-1 text-left px-2 py-2 text-sm truncate ${activeProjectId === proj.id ? 'font-bold text-primary-600 dark:text-primary-400' : 'text-secondary-600 dark:text-secondary-300'}`}
                        >
                            {proj.name}
                        </button>
                        <button
                            onClick={(e) => handleDeleteProject(e, proj.id, proj.name)}
                            className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-secondary-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            title={t('deleteProject')}
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                </div>
            </div>
        )}
      </div>

      <div className="flex-1 px-4 py-2 overflow-y-auto">
        <nav className="space-y-2">
            {navItems.map(item => (
            <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`flex items-center w-full px-4 py-2.5 text-left rounded-lg transition-colors duration-200 ${
                    activeTab === item.id 
                    ? 'bg-primary-100 dark:bg-secondary-800 text-primary-600 dark:text-primary-300 font-semibold' 
                    : 'text-secondary-600 dark:text-secondary-300 hover:bg-primary-50 dark:hover:bg-secondary-800/50'
                }`}
            >
                {item.icon}
                <span className="ml-3 text-sm">{item.label}</span>
            </button>
            ))}
        </nav>
      </div>

      <div className="px-4 py-4 border-t border-secondary-200 dark:border-secondary-800 text-center">
         <p className="text-xs text-secondary-500">© 2024 Mineral Tech</p>
      </div>

      {/* Navigation Confirmation Modal */}
      {showConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white dark:bg-secondary-800 p-6 rounded-lg shadow-xl max-w-xs w-full mx-4 border border-secondary-200 dark:border-secondary-700">
                  <h3 className="text-lg font-bold mb-2 text-secondary-900 dark:text-white">{t('unsavedChanges')}</h3>
                  <p className="text-sm text-secondary-600 dark:text-secondary-300 mb-6">{t('confirmNavigation')}</p>
                  <div className="flex flex-col space-y-2">
                      <button onClick={handleConfirmSave} className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors font-medium">
                          {t('saveChanges')}
                      </button>
                      <button onClick={handleConfirmDiscard} className="w-full py-2 bg-secondary-200 hover:bg-secondary-300 dark:bg-secondary-700 dark:hover:bg-secondary-600 text-secondary-800 dark:text-secondary-200 rounded-md transition-colors font-medium">
                          {t('discardChanges')}
                      </button>
                      <button onClick={() => setShowConfirm(false)} className="w-full py-2 text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300 text-sm mt-2">
                          Cancel
                      </button>
                  </div>
              </div>
          </div>
      )}
    </aside>
  );
};

export default Sidebar;
