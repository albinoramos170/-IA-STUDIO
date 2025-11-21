
import React, { useState, useContext, useEffect } from 'react';
import ProjectSetup from './ProjectDetails';
import DataTable from './DataTable';
import ReserveCalculations from './ReserveCalculations';
import FinancialAnalysis from './FinancialAnalysis';
import GraphicalAnalysis from './GraphicalAnalysis';
import ReportGenerator from './ReportGenerator';
import ProjectComparison from './ProjectComparison';
import Heatmap from './Heatmap';
import StatisticsTab from './StatisticsTab';
import { ProjectContext } from '../contexts/ProjectContext';
import { EconomicParams } from '../types';
import PencilSquareIcon from './icons/PencilSquareIcon';

interface DashboardProps {
  t: (key: string) => string;
  activeTab: string;
}

const ParamInput: React.FC<{ label: string; name: keyof EconomicParams; value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; disabled?: boolean }> = ({ label, name, value, onChange, disabled }) => (
    <div>
        <label className="block text-sm font-medium text-secondary-600 dark:text-secondary-400">{label}</label>
        <input
            type="number"
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="mt-1 w-full bg-secondary-50 dark:bg-secondary-800 border border-secondary-300 dark:border-secondary-700 rounded-lg p-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-60 disabled:cursor-not-allowed"
        />
    </div>
);


const DataInputTab: React.FC<{ t: (key: string) => string }> = ({ t }) => {
    const context = React.useContext(ProjectContext);
    if (!context) return null;
    const { 
        project, setProject, saveGeotechnicalParams,
        economicParams, setEconomicParams, saveEconomicParams,
        activeProjectId
    } = context;
    
    const isNewProject = !activeProjectId || activeProjectId === 'new';
    const [isGeoSaved, setIsGeoSaved] = useState(false);
    const [isEcoSaved, setIsEcoSaved] = useState(false);
    const [isGeoEditable, setIsGeoEditable] = useState(isNewProject);
    const [isEcoEditable, setIsEcoEditable] = useState(isNewProject);

    useEffect(() => {
        const isNew = !activeProjectId || activeProjectId === 'new';
        setIsGeoEditable(isNew);
        setIsEcoEditable(isNew);
    }, [activeProjectId]);

    const handleProjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setProject(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value
        }));
    };

    const handleEconomicParamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEconomicParams(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    };

    const handleGeoSave = async () => {
        await saveGeotechnicalParams();
        setIsGeoEditable(false);
        setIsGeoSaved(true);
        setTimeout(() => setIsGeoSaved(false), 2000);
    };

    const handleEcoSave = async () => {
        await saveEconomicParams();
        setIsEcoEditable(false);
        setIsEcoSaved(true);
        setTimeout(() => setIsEcoSaved(false), 2000);
    };
    
    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-secondary-900 p-6 rounded-xl shadow-lg">
                 <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-semibold text-primary-700 dark:text-primary-300">{t('geotechnicalParameters')}</h3>
                 </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label htmlFor="swellFactorSterile" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">{t('swellFactorSterile')}</label>
                        <input disabled={!isGeoEditable} type="number" id="swellFactorSterile" name="swellFactorSterile" value={project.swellFactorSterile} onChange={handleProjectChange} step="0.01" className="w-full bg-secondary-50 dark:bg-secondary-800 border border-secondary-300 dark:border-secondary-700 rounded-lg shadow-sm p-2.5 focus:ring-primary-500 focus:border-primary-500 transition disabled:opacity-60 disabled:cursor-not-allowed" />
                    </div>
                    <div>
                        <label htmlFor="swellFactorGravel" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">{t('swellFactorGravel')}</label>
                        <input disabled={!isGeoEditable} type="number" id="swellFactorGravel" name="swellFactorGravel" value={project.swellFactorGravel} onChange={handleProjectChange} step="0.01" className="w-full bg-secondary-50 dark:bg-secondary-800 border border-secondary-300 dark:border-secondary-700 rounded-lg shadow-sm p-2.5 focus:ring-primary-500 focus:border-primary-500 transition disabled:opacity-60 disabled:cursor-not-allowed" />
                    </div>
                    <div>
                        <label htmlFor="dilutionFactor" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">{t('dilutionFactor')}</label>
                        <input disabled={!isGeoEditable} type="number" id="dilutionFactor" name="dilutionFactor" value={project.dilutionFactor} onChange={handleProjectChange} step="1" className="w-full bg-secondary-50 dark:bg-secondary-800 border border-secondary-300 dark:border-secondary-700 rounded-lg shadow-sm p-2.5 focus:ring-primary-500 focus:border-primary-500 transition disabled:opacity-60 disabled:cursor-not-allowed" />
                    </div>
                </div>
                 <div className="mt-6 flex justify-end items-center gap-3">
                    {isGeoSaved && <span className="text-green-600 dark:text-green-400 font-medium animate-pulse">{t('saved')}</span>}
                    {!isGeoEditable ? (
                         <button
                            onClick={() => setIsGeoEditable(true)}
                            className="px-5 py-2 bg-secondary-200 dark:bg-secondary-700 text-secondary-800 dark:text-secondary-200 rounded-lg hover:bg-secondary-300 dark:hover:bg-secondary-600 transition-all duration-200 text-sm font-semibold flex items-center"
                        >
                            <PencilSquareIcon className="h-4 w-4 mr-1.5" />
                            {t('edit')}
                        </button>
                    ) : (
                        <button
                            onClick={handleGeoSave}
                            className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 text-sm font-semibold flex items-center"
                        >
                            {t('save')}
                        </button>
                    )}
                </div>
            </div>
             <div className="bg-white dark:bg-secondary-900 p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-semibold mb-4 text-primary-700 dark:text-primary-300">{t('economicParameters')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ParamInput disabled={!isEcoEditable} label={t('diamondPrice')} name="diamondPrice" value={economicParams.diamondPrice} onChange={handleEconomicParamChange} />
                    <ParamInput disabled={!isEcoEditable} label={t('sterileRemovalCost')} name="sterileRemovalCost" value={economicParams.sterileRemovalCost} onChange={handleEconomicParamChange} />
                    <ParamInput disabled={!isEcoEditable} label={t('gravelTransportCost')} name="gravelTransportCost" value={economicParams.gravelTransportCost} onChange={handleEconomicParamChange} />
                    <ParamInput disabled={!isEcoEditable} label={t('processingCost')} name="processingCost" value={economicParams.processingCost} onChange={handleEconomicParamChange} />
                    <ParamInput disabled={!isEcoEditable} label={t('transportDistance')} name="transportDistance" value={economicParams.transportDistance} onChange={handleEconomicParamChange} />
                    <ParamInput disabled={!isEcoEditable} label={t('recoveryRate')} name="recoveryRate" value={economicParams.recoveryRate} onChange={handleEconomicParamChange} />
                </div>
                <div className="mt-6 flex justify-end items-center gap-3">
                    {isEcoSaved && <span className="text-green-600 dark:text-green-400 font-medium animate-pulse">{t('saved')}</span>}
                    {!isEcoEditable ? (
                         <button
                            onClick={() => setIsEcoEditable(true)}
                            className="px-5 py-2 bg-secondary-200 dark:bg-secondary-700 text-secondary-800 dark:text-secondary-200 rounded-lg hover:bg-secondary-300 dark:hover:bg-secondary-600 transition-all duration-200 text-sm font-semibold flex items-center"
                        >
                            <PencilSquareIcon className="h-4 w-4 mr-1.5" />
                            {t('edit')}
                        </button>
                    ) : (
                        <button
                            onClick={handleEcoSave}
                            className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 text-sm font-semibold flex items-center"
                        >
                            {t('save')}
                        </button>
                    )}
                </div>
            </div>
            <div className="bg-white dark:bg-secondary-900 p-6 rounded-xl shadow-lg">
                 <DataTable t={t} />
            </div>
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ t, activeTab }) => {
    const { isDirty, saveProjectDetails } = useContext(ProjectContext) || { isDirty: false, saveProjectDetails: async () => {} };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'project-setup':
                return <ProjectSetup t={t} />;
            case 'data-input':
                return <DataInputTab t={t} />;
            case 'reserve-analysis':
                return (
                    <div className="bg-white dark:bg-secondary-900 p-6 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-bold mb-6 text-primary-700 dark:text-primary-300 border-b-2 border-primary-200 dark:border-primary-800 pb-2">{t('reserveAnalysis')}</h2>
                        <ReserveCalculations t={t} />
                    </div>
                );
            case 'graphical-analysis':
                return (
                    <div className="bg-white dark:bg-secondary-900 p-6 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-bold mb-6 text-primary-700 dark:text-primary-300 border-b-2 border-primary-200 dark:border-primary-800 pb-2">{t('graphicalAnalysis')}</h2>
                        <GraphicalAnalysis t={t} />
                    </div>
                );
            case 'comparison-blocks':
                return (
                    <div className="bg-white dark:bg-secondary-900 p-6 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-bold mb-6 text-primary-700 dark:text-primary-300 border-b-2 border-primary-200 dark:border-primary-800 pb-2">{t('comparisonBlocks')}</h2>
                        <ProjectComparison t={t} />
                    </div>
                );
            case 'financial-analysis':
                return (
                    <div className="bg-white dark:bg-secondary-900 p-6 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-bold mb-6 text-primary-700 dark:text-primary-300 border-b-2 border-primary-200 dark:border-primary-800 pb-2">{t('financialAnalysis')}</h2>
                         <FinancialAnalysis t={t} />
                    </div>
                );
            case 'heatmap':
                return (
                    <div className="bg-white dark:bg-secondary-900 p-6 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-bold mb-6 text-primary-700 dark:text-primary-300 border-b-2 border-primary-200 dark:border-primary-800 pb-2">{t('heatmap')}</h2>
                        <Heatmap />
                    </div>
                );
            case 'statistics':
                return (
                    <div className="bg-white dark:bg-secondary-900 p-6 rounded-xl shadow-lg">
                        <StatisticsTab t={t} />
                    </div>
                );
            case 'ai-report':
                return (
                    <div className="bg-white dark:bg-secondary-900 p-6 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-bold mb-6 text-primary-700 dark:text-primary-300 border-b-2 border-primary-200 dark:border-primary-800 pb-2">{t('aiReport')}</h2>
                        <ReportGenerator t={t} />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="relative min-h-full pb-12">
           {renderTabContent()}
           {isDirty && (
             <div className="fixed bottom-4 right-4 z-40 bg-white dark:bg-secondary-800 shadow-xl border border-secondary-200 dark:border-secondary-700 rounded-lg p-4 flex items-center space-x-4 animate-bounce-in">
                <div className="flex items-center text-amber-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="font-medium text-secondary-800 dark:text-secondary-100">{t('unsavedChanges')}</span>
                </div>
                <button onClick={() => saveProjectDetails()} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-bold shadow-sm">
                    {t('save')}
                </button>
             </div>
           )}
        </div>
    );
};

export default Dashboard;
