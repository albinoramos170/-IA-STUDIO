import React, { createContext, useState, useMemo, useEffect, ReactNode, useCallback, useRef } from 'react';
import { Project, Sample, EconomicParams, CalculatedReserves, FinancialResult, ProjectListItem, ProjectData, ProjectSettings } from '../types';
import { useHistory } from '../hooks/useHistory';
import { apiService } from '../services/apiService';
import { calculateReserves, calculateFinancials } from '../utils/calculations';

type ValidationErrors = {
    [sampleId: number]: {
        [field in keyof Sample]?: string;
    };
};

interface ProjectContextType {
    project: Project;
    setProject: (project: Project | ((p: Project) => Project)) => void;
    saveGeotechnicalParams: () => Promise<void>;
    totalBlockArea: number;
    setTotalBlockArea: (area: number | ((a: number) => number)) => void;
    samples: Sample[];
    setSamples: (samples: Sample[] | ((s: Sample[]) => Sample[])) => void;
    undoSamples: () => void;
    redoSamples: () => void;
    canUndoSamples: boolean;
    canRedoSamples: boolean;
    economicParams: EconomicParams;
    setEconomicParams: (params: EconomicParams | ((p: EconomicParams) => EconomicParams)) => void;
    saveEconomicParams: () => Promise<void>;
    settings: ProjectSettings;
    setSettings: (settings: ProjectSettings | ((s: ProjectSettings) => ProjectSettings)) => void;
    saveSettings: () => Promise<void>;
    calculatedReserves: CalculatedReserves;
    financialResult: FinancialResult;
    startNewProject: () => void;
    saveProjectDetails: () => Promise<void>;
    loadProject: (id: string) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    projects: ProjectListItem[];
    activeProjectId: string | null;
    validationErrors: ValidationErrors;
    validateSamples: () => Promise<boolean>;
    clearValidationError: (sampleId: number, field: keyof Sample) => void;
    isDirty: boolean;
    discardChanges: () => void;
}

export const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const initialProject: Project = {
    userName: 'Admin',
    blockId: 'B1',
    projectName: 'New Project',
    projectDescription: '',
    date: new Date().toISOString().split('T')[0],
    swellFactorSterile: 1.25,
    swellFactorGravel: 1.15,
    dilutionFactor: 10,
};

const initialSamples: Sample[] = [
    { id: 1, line: 'L1', pit: 'P1', sterileDepth: 1.5, gravelDepth: 0.8, area: 10, stones: 5, carats: 2.5 },
    { id: 2, line: 'L1', pit: 'P2', sterileDepth: 1.8, gravelDepth: 0.9, area: 10, stones: 8, carats: 4.1 },
];

const initialEconomicParams: EconomicParams = {
    diamondPrice: 450,
    sterileRemovalCost: 5.5,
    gravelTransportCost: 1.2,
    processingCost: 15.0,
    transportDistance: 10,
    recoveryRate: 95,
};

const initialSettings: ProjectSettings = {
    defaultCurrency: 'USD',
    unitSystem: 'metric',
};

const initialTotalBlockArea = 10000;

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [projects, setProjects] = useState<ProjectListItem[]>([]);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

    const [project, setProject] = useState<Project>(initialProject);
    const [totalBlockArea, setTotalBlockArea] = useState<number>(initialTotalBlockArea);
    const {
        state: samples,
        setState: setSamples,
        undo: undoSamples,
        redo: redoSamples,
        canUndo: canUndoSamples,
        canRedo: canRedoSamples,
        resetHistory,
    } = useHistory<Sample[]>(initialSamples);
    const [economicParams, setEconomicParams] = useState<EconomicParams>(initialEconomicParams);
    const [settings, setSettings] = useState<ProjectSettings>(initialSettings);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    
    // Dirty state tracking
    const [isDirty, setIsDirty] = useState(false);
    // Backup for discard
    const originalProject = useRef<Project>(initialProject);
    const originalEconomicParams = useRef<EconomicParams>(initialEconomicParams);
    const originalSettings = useRef<ProjectSettings>(initialSettings);
    const originalTotalBlockArea = useRef<number>(initialTotalBlockArea);

    // Wrap setters to set dirty
    const setProjectWrapper = useCallback((update: Project | ((p: Project) => Project)) => {
        setProject(update);
        setIsDirty(true);
    }, []);

    const setEconomicParamsWrapper = useCallback((update: EconomicParams | ((p: EconomicParams) => EconomicParams)) => {
        setEconomicParams(update);
        setIsDirty(true);
    }, []);

    const setSettingsWrapper = useCallback((update: ProjectSettings | ((s: ProjectSettings) => ProjectSettings)) => {
        setSettings(update);
        setIsDirty(true);
    }, []);

    const setTotalBlockAreaWrapper = useCallback((update: number | ((a: number) => number)) => {
        setTotalBlockArea(update);
        setIsDirty(true);
    }, []);

    const loadProject = useCallback(async (id: string) => {
        const data = await apiService.getProjectData(id);
        if (data) {
            setProject(data.project);
            setTotalBlockArea(data.totalBlockArea);
            resetHistory(data.samples);
            setEconomicParams(data.economicParams);
            setSettings(data.settings || initialSettings);
            
            // Update backups
            originalProject.current = data.project;
            originalEconomicParams.current = data.economicParams;
            originalSettings.current = data.settings || initialSettings;
            originalTotalBlockArea.current = data.totalBlockArea;

            setActiveProjectId(id);
            localStorage.setItem('activeProjectId', id); 
            setIsDirty(false);
        }
    }, [resetHistory]);

    const startNewProject = useCallback(() => {
        setActiveProjectId('new');
        setProject(initialProject);
        setTotalBlockArea(initialTotalBlockArea);
        resetHistory(initialSamples);
        setEconomicParams(initialEconomicParams);
        setSettings(initialSettings);
        setValidationErrors({});
        
        originalProject.current = initialProject;
        originalEconomicParams.current = initialEconomicParams;
        originalSettings.current = initialSettings;
        originalTotalBlockArea.current = initialTotalBlockArea;
        
        setIsDirty(false);
    }, [resetHistory]);
    
    const discardChanges = useCallback(() => {
        setProject(originalProject.current);
        setEconomicParams(originalEconomicParams.current);
        setSettings(originalSettings.current);
        setTotalBlockArea(originalTotalBlockArea.current);
        setIsDirty(false);
    }, []);

    useEffect(() => {
        const initializeApp = async () => {
            const projectsList = await apiService.getProjectsList();
            const savedActiveId = localStorage.getItem('activeProjectId');
            
            if (projectsList.length > 0) {
                setProjects(projectsList);
                const idToLoad = savedActiveId && projectsList.some(p => p.id === savedActiveId)
                    ? savedActiveId
                    : projectsList[0].id;
                await loadProject(idToLoad);
            } else {
                const defaultProjectData: ProjectData = {
                    project: { ...initialProject, projectName: 'Default Project' },
                    totalBlockArea: initialTotalBlockArea,
                    samples: initialSamples,
                    economicParams: initialEconomicParams,
                    settings: initialSettings,
                };
                const newProjectItem = await apiService.createNewProject(defaultProjectData);
                setProjects([newProjectItem]);
                await loadProject(newProjectItem.id);
            }
        };

        initializeApp();
    }, []);

    const updateBackups = () => {
        originalProject.current = project;
        originalEconomicParams.current = economicParams;
        originalSettings.current = settings;
        originalTotalBlockArea.current = totalBlockArea;
        setIsDirty(false);
    };

    const saveProjectDetails = useCallback(async () => {
        const isNew = !activeProjectId || activeProjectId === 'new';
        
        const currentData: ProjectData = {
            project,
            totalBlockArea,
            samples,
            economicParams,
            settings,
        };

        if (isNew) {
            const newItem = await apiService.createNewProject(currentData);
            setProjects(prev => [...prev, newItem]);
            setActiveProjectId(newItem.id);
            localStorage.setItem('activeProjectId', newItem.id);
        } else {
            await apiService.saveProjectData(activeProjectId!, currentData);
            const projectInList = projects.find(p => p.id === activeProjectId);
            if (projectInList && projectInList.name !== project.projectName) {
                setProjects(prev => prev.map(p =>
                    p.id === activeProjectId ? { ...p, name: project.projectName } : p
                ));
            }
        }
        updateBackups();
    }, [activeProjectId, project, totalBlockArea, samples, economicParams, settings, projects]);

    const deleteProject = useCallback(async (id: string) => {
        await apiService.deleteProject(id);
        const updatedProjects = projects.filter(p => p.id !== id);
        setProjects(updatedProjects);

        if (activeProjectId === id) {
            if (updatedProjects.length > 0) {
                await loadProject(updatedProjects[0].id);
            } else {
                startNewProject();
            }
        }
    }, [projects, activeProjectId, loadProject, startNewProject]);
    
    const savePartialData = useCallback(async (updates: Partial<ProjectData>) => {
        if (!activeProjectId || activeProjectId === 'new') return;
        
        const currentData = await apiService.getProjectData(activeProjectId);
        if (currentData) {
            const updatedProject = updates.project ? { ...currentData.project, ...updates.project } : currentData.project;
            const updatedEconomicParams = updates.economicParams ? { ...currentData.economicParams, ...updates.economicParams } : currentData.economicParams;
             const updatedSettings = updates.settings ? { ...currentData.settings, ...updates.settings } : currentData.settings;

            const newData: ProjectData = {
                ...currentData,
                ...updates,
                project: updatedProject,
                economicParams: updatedEconomicParams,
                settings: updatedSettings
            };
            await apiService.saveProjectData(activeProjectId, newData);
            updateBackups();
        }
    }, [activeProjectId]);

    const saveGeotechnicalParams = useCallback(async () => {
        await savePartialData({ project });
    }, [project, savePartialData]);
    
    const saveEconomicParams = useCallback(async () => {
        await savePartialData({ economicParams });
    }, [economicParams, savePartialData]);

    const saveSettings = useCallback(async () => {
        await savePartialData({ settings });
    }, [settings, savePartialData]);

    const validateSamples = useCallback(async () => {
        const errors: ValidationErrors = {};
        samples.forEach(sample => {
            const sampleErrors: { [field in keyof Sample]?: string } = {};
            if (!sample.line?.trim()) sampleErrors.line = 'Line is required';
            if (!sample.pit?.trim()) sampleErrors.pit = 'Pit is required';
            if (sample.sterileDepth < 0) sampleErrors.sterileDepth = 'Cannot be negative';
            if (sample.gravelDepth < 0) sampleErrors.gravelDepth = 'Cannot be negative';
            if (sample.area <= 0) sampleErrors.area = 'Must be positive';
            if (sample.stones < 0) sampleErrors.stones = 'Cannot be negative';
            if (sample.carats < 0) sampleErrors.carats = 'Cannot be negative';
            
            if (Object.keys(sampleErrors).length > 0) {
                errors[sample.id] = sampleErrors;
            }
        });
        
        if (Object.keys(errors).length === 0) {
            await savePartialData({ samples });
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [samples, savePartialData]);
    
    const clearValidationError = useCallback((sampleId: number, field: keyof Sample) => {
        setValidationErrors(prev => {
            if (!prev[sampleId] || !prev[sampleId][field]) return prev;
            const newSampleErrors = { ...prev[sampleId] };
            delete newSampleErrors[field];
            
            if (Object.keys(newSampleErrors).length === 0) {
                const newErrors = { ...prev };
                delete newErrors[sampleId];
                return newErrors;
            } else {
                return { ...prev, [sampleId]: newSampleErrors };
            }
        });
    }, []);

    // Use utility functions for calculations
    const calculatedReserves: CalculatedReserves = useMemo(() => {
        return calculateReserves(samples, totalBlockArea, project);
    }, [samples, project, totalBlockArea]);

    const financialResult: FinancialResult = useMemo(() => {
        return calculateFinancials(calculatedReserves, economicParams);
    }, [calculatedReserves, economicParams]);
    
    const value = {
        project, setProject: setProjectWrapper,
        saveGeotechnicalParams,
        totalBlockArea, setTotalBlockArea: setTotalBlockAreaWrapper,
        samples, setSamples,
        undoSamples, redoSamples,
        canUndoSamples, canRedoSamples,
        economicParams, setEconomicParams: setEconomicParamsWrapper,
        saveEconomicParams,
        settings, setSettings: setSettingsWrapper,
        saveSettings,
        calculatedReserves, financialResult,
        startNewProject,
        saveProjectDetails,
        loadProject,
        deleteProject,
        projects,
        activeProjectId,
        validationErrors,
        validateSamples,
        clearValidationError,
        isDirty,
        discardChanges,
    };
    
    return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};