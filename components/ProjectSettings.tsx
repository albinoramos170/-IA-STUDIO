
import React, { useContext, useState } from 'react';
import { ProjectContext } from '../contexts/ProjectContext';

interface ProjectSettingsProps {
    t: (key: string) => string;
}

const ProjectSettings: React.FC<ProjectSettingsProps> = ({ t }) => {
    const context = useContext(ProjectContext);
    if (!context) throw new Error("ProjectSettings must be used within a ProjectProvider");
    const { settings, setSettings, saveSettings, isDirty } = context;
    const [savedMsg, setSavedMsg] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        await saveSettings();
        setSavedMsg(true);
        setTimeout(() => setSavedMsg(false), 2000);
    };

    return (
        <div className="bg-white dark:bg-secondary-900 p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-primary-700 dark:text-primary-300 border-b-2 border-primary-200 dark:border-primary-800 pb-2">{t('projectSettings')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                <div>
                    <label htmlFor="defaultCurrency" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">{t('defaultCurrency')}</label>
                    <select
                        id="defaultCurrency"
                        name="defaultCurrency"
                        value={settings.defaultCurrency}
                        onChange={handleChange}
                        className="w-full bg-secondary-50 dark:bg-secondary-800 border border-secondary-300 dark:border-secondary-700 rounded-lg shadow-sm p-2.5 focus:ring-primary-500 focus:border-primary-500 transition"
                    >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="BRL">BRL (R$)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="AOA">AOA (Kz)</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="unitSystem" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">{t('unitSystem')}</label>
                    <select
                        id="unitSystem"
                        name="unitSystem"
                        value={settings.unitSystem}
                        onChange={handleChange}
                        className="w-full bg-secondary-50 dark:bg-secondary-800 border border-secondary-300 dark:border-secondary-700 rounded-lg shadow-sm p-2.5 focus:ring-primary-500 focus:border-primary-500 transition"
                    >
                        <option value="metric">{t('metric')}</option>
                        <option value="imperial">{t('imperial')}</option>
                    </select>
                    <p className="mt-1 text-xs text-secondary-500">Note: Changing unit system does not automatically convert existing data values.</p>
                </div>
            </div>

            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={!isDirty}
                    className={`px-6 py-2.5 text-white rounded-lg transition-all duration-200 text-sm font-semibold flex items-center shadow-md ${
                        isDirty ? 'bg-primary-600 hover:bg-primary-700' : 'bg-secondary-400 cursor-not-allowed'
                    }`}
                >
                    {savedMsg ? t('saved') : t('saveChanges')}
                </button>
            </div>
        </div>
    );
};

export default ProjectSettings;
