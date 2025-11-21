
import React, { useContext, useState, useEffect } from 'react';
import { ProjectContext } from '../contexts/ProjectContext';

interface ProjectSetupProps {
    t: (key: string) => string;
}

const InputField: React.FC<{ label: string; id: string; type: string; value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; step?: string }> = ({ label, id, type, value, onChange, step }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">{label}</label>
        <input
            type={type}
            id={id}
            name={id}
            value={value}
            onChange={onChange}
            step={step}
            className="w-full bg-secondary-50 dark:bg-secondary-800 border border-secondary-300 dark:border-secondary-700 rounded-lg shadow-sm p-2.5 focus:ring-primary-500 focus:border-primary-500 transition"
        />
    </div>
);


const ProjectSetup: React.FC<ProjectSetupProps> = ({ t }) => {
    const context = useContext(ProjectContext);
    if (!context) throw new Error("ProjectSetup must be used within a ProjectProvider");
    const { project, setProject, totalBlockArea, setTotalBlockArea, saveProjectDetails, activeProjectId } = context;
    const [isSaved, setIsSaved] = useState(false);

    const isNewProject = !activeProjectId || activeProjectId === 'new';
    
    useEffect(() => {
        // Reset save confirmation when switching projects
        setIsSaved(false);
    }, [activeProjectId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setProject(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value
        }));
    };
    
    const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProject(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const handleAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTotalBlockArea(parseFloat(e.target.value) || 0);
    };

    const handleSave = () => {
        saveProjectDetails();
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    }
    
    const headerText = isNewProject 
        ? t('creatingNewProject') 
        : `${t('editingProject')}: "${project.projectName}"`;

    return (
        <div className="bg-white dark:bg-secondary-900 p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-primary-700 dark:text-primary-300 border-b-2 border-primary-200 dark:border-primary-800 pb-2">{headerText}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InputField label={t('projectName')} id="projectName" type="text" value={project.projectName} onChange={handleChange} />
                <InputField label={t('userName')} id="userName" type="text" value={project.userName} onChange={handleChange} />
                <InputField label={t('blockId')} id="blockId" type="text" value={project.blockId} onChange={handleChange} />
                <InputField label={t('date')} id="date" type="date" value={project.date} onChange={handleChange} />
                <InputField label={t('totalBlockArea')} id="totalBlockArea" type="number" value={totalBlockArea} onChange={handleAreaChange} step="100"/>
                
                <div className="col-span-1 md:col-span-2 lg:col-span-3">
                    <label htmlFor="projectDescription" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">{t('projectDescription')}</label>
                    <textarea
                        id="projectDescription"
                        name="projectDescription"
                        value={project.projectDescription}
                        onChange={handleTextAreaChange}
                        rows={3}
                        className="w-full bg-secondary-50 dark:bg-secondary-800 border border-secondary-300 dark:border-secondary-700 rounded-lg shadow-sm p-2.5 focus:ring-primary-500 focus:border-primary-500 transition"
                    />
                </div>
            </div>
            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleSave}
                    className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 text-sm font-semibold disabled:bg-primary-400 flex items-center shadow-md"
                    disabled={isSaved}
                >
                    {isSaved ? (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            {t('saved')}
                        </>
                    ) : t('saveProject')}
                </button>
            </div>
        </div>
    );
};

export default ProjectSetup;