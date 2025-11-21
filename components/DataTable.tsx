
import React, { useRef, useContext, useState, useEffect } from 'react';
import { Sample } from '../types';
import { ProjectContext } from '../contexts/ProjectContext';
import PencilSquareIcon from './icons/PencilSquareIcon';

declare var XLSX: any;

interface DataTableProps {
    t: (key: string) => string;
}

const headerMapping: { [key: string]: string } = {
    'line': 'line',
    'pit': 'pit',
    'sterile (m)': 'sterileDepth',
    'sterile': 'sterileDepth',
    'gravel (m)': 'gravelDepth',
    'gravel': 'gravelDepth',
    'area (m²)': 'area',
    'area': 'area',
    'stones': 'stones',
    'carats': 'carats',
    'linha': 'line',
    'poço': 'pit',
    'esteril (m)': 'sterileDepth',
    'estéril (m)': 'sterileDepth',
    'esteril': 'sterileDepth',
    'estéril': 'sterileDepth',
    'cascalho (m)': 'gravelDepth',
    'cascalho': 'gravelDepth',
    'área (m²)': 'area',
    'área': 'area',
    'pedras': 'stones',
    'quilates': 'carats',
    'linea': 'line',
    'línea': 'line',
    'pozo': 'pit',
    'grava (m)': 'gravelDepth',
    'grava': 'gravelDepth',
    'piedras': 'stones',
};

const DataTable: React.FC<DataTableProps> = ({ t }) => {
    const context = useContext(ProjectContext);
    if (!context) throw new Error("DataTable must be used within a ProjectProvider");
    
    const { 
        samples, 
        setSamples,
        undoSamples,
        redoSamples,
        canUndoSamples,
        canRedoSamples,
        validateSamples,
        validationErrors,
        clearValidationError,
        activeProjectId,
    } = context;
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    
    // Bulk Edit State
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [bulkField, setBulkField] = useState<keyof Sample>('sterileDepth');
    const [bulkOperation, setBulkOperation] = useState<'set' | 'add'>('set');
    const [bulkValue, setBulkValue] = useState<string>('');

    useEffect(() => {
        const isNew = !activeProjectId || activeProjectId === 'new';
        setIsEditing(isNew);
        if (!isNew) setSelectedIds(new Set());
    }, [activeProjectId]);

    const onAddSample = () => {
        setSamples(prev => [...prev, { id: Date.now(), line: '', pit: '', sterileDepth: 0, gravelDepth: 0, area: 0, stones: 0, carats: 0 }]);
    };
    
    const onRemoveSample = (id: number) => {
        setSamples(prev => prev.filter(s => s.id !== id));
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    };

    const onSampleChange = (id: number, field: keyof Sample, value: any) => {
        setSamples(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
        if (validationErrors[id]?.[field]) {
            clearValidationError(id, field);
        }
    };

    const handleSave = async () => {
        const isValid = await validateSamples();
        if (isValid) {
            setIsEditing(false);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
            setSelectedIds(new Set()); // Clear selection on save
        }
    };
    
    // Bulk Edit Logic
    const toggleSelection = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === samples.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(samples.map(s => s.id)));
        }
    };

    const applyBulkEdit = () => {
        if (selectedIds.size === 0) return;
        
        setSamples(prev => prev.map(sample => {
            if (!selectedIds.has(sample.id)) return sample;
            
            let newValue: string | number = sample[bulkField];
            const inputVal = parseFloat(bulkValue);

            if (typeof sample[bulkField] === 'number') {
                 if (isNaN(inputVal)) return sample; // Invalid number input
                 if (bulkOperation === 'set') newValue = inputVal;
                 else newValue = (sample[bulkField] as number) + inputVal;
            } else {
                 // String fields
                 if (bulkOperation === 'set') newValue = bulkValue;
                 else newValue = String(sample[bulkField]) + bulkValue;
            }
            
            return { ...sample, [bulkField]: newValue };
        }));
        
        // Clear selection or keep it? Keeping it allows chaining edits.
    };

    // ... File import logic ...
    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const processData = (data: any[]) => {
            const newSamples: Sample[] = data
                .map((row, index) => {
                    const sample: any = { id: Date.now() + index };
                    for (const key in row) {
                        const normalizedKey = String(key).toLowerCase().trim();
                        const sampleKey = headerMapping[normalizedKey as keyof typeof headerMapping];
                        if (sampleKey) {
                           sample[sampleKey] = row[key];
                        }
                    }
                    if (Object.keys(sample).length < 3) return null;
                    
                    const parseNumber = (val: any) => parseFloat(String(val || '0').replace(',', '.')) || 0;

                    return {
                        id: sample.id,
                        line: String(sample.line || ''),
                        pit: String(sample.pit || ''),
                        sterileDepth: parseNumber(sample.sterileDepth),
                        gravelDepth: parseNumber(sample.gravelDepth),
                        area: parseNumber(sample.area),
                        stones: parseInt(String(sample.stones || '0'), 10) || 0,
                        carats: parseNumber(sample.carats),
                    };
                })
                .filter((sample): sample is Sample => sample !== null);
            
            if (newSamples.length > 0) {
              setSamples(newSamples);
            }
        };

        if (file.name.endsWith('.csv')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                const rows = text.split(/[\r\n]+/).filter(r => r.trim() !== '');
                if (rows.length < 2) return;
                const header = rows[0].split(/[;,]/).map(h => h.trim().replace(/"/g, ''));
                const data = rows.slice(1).map(row => {
                    const values = row.split(/[;,]/);
                    return header.reduce((obj, h, i) => {
                        obj[h] = values[i]?.trim().replace(/"/g, '') || '';
                        return obj;
                    }, {} as any);
                });
                processData(data);
            };
            reader.readAsText(file);
        } else if (file.name.endsWith('.xlsx')) {
             const reader = new FileReader();
             reader.onload = (e) => {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                processData(json);
            };
            reader.readAsArrayBuffer(file);
        }
    };


    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const renderCell = (sample: Sample, field: keyof Sample, type: string) => {
        const value = sample[field];
        const error = validationErrors[sample.id]?.[field];
        const inputClassName = `w-full bg-transparent p-1.5 rounded-md outline-none transition-shadow ${error ? 'ring-2 ring-red-500' : 'focus:ring-1 focus:ring-primary-500'} disabled:cursor-not-allowed disabled:text-secondary-600 dark:disabled:text-secondary-400`;
        
        return (
            <input
                type={type}
                value={value as string | number}
                onChange={(e) => onSampleChange(sample.id, field, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                className={inputClassName}
                step={type === 'number' ? '0.01' : undefined}
                title={error}
                disabled={!isEditing}
            />
        );
    }
    
    return (
        <div>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <h3 className="text-lg font-semibold">{t('sampleDataTable')}</h3>
                <div className="flex items-center space-x-2">
                     {isSaved && <span className="text-green-600 dark:text-green-400 font-medium text-sm animate-pulse mr-2">{t('saved')}</span>}
                     {isEditing ? (
                        <>
                            <button onClick={undoSamples} disabled={!canUndoSamples} className="p-2 rounded-lg hover:bg-secondary-200 dark:hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200" title="Undo">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 15l-3-3m0 0l3-3m-3 3h8a5 5 0 000-10H9" /></svg>
                            </button>
                            <button onClick={redoSamples} disabled={!canRedoSamples} className="p-2 rounded-lg hover:bg-secondary-200 dark:hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200" title="Redo">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 9l3 3m0 0l-3 3m3-3H5a5 5 0 000 10h8" /></svg>
                            </button>
                            <div className="w-px h-6 bg-secondary-300 dark:bg-secondary-600 mx-1"></div>
                            <input type="file" accept=".csv,.xlsx" ref={fileInputRef} onChange={handleFileImport} className="hidden" />
                            <button 
                                onClick={handleSave} 
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition duration-200 text-sm font-semibold"
                            >
                                {t('validateData')}
                            </button>
                            <button onClick={triggerFileInput} className="px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition duration-200 text-sm">
                                {t('importCSV')}
                            </button>
                            <button onClick={onAddSample} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition duration-200 text-sm">
                                {t('addSample')}
                            </button>
                        </>
                     ) : (
                        <button 
                            onClick={() => setIsEditing(true)} 
                            className="px-4 py-2 bg-secondary-200 dark:bg-secondary-700 text-secondary-800 dark:text-secondary-200 rounded-lg hover:bg-secondary-300 dark:hover:bg-secondary-600 transition duration-200 text-sm font-semibold flex items-center"
                        >
                             <PencilSquareIcon className="h-4 w-4 mr-1.5" />
                            {t('edit')}
                        </button>
                     )}
                </div>
            </div>

            {/* Bulk Edit Toolbar */}
            {isEditing && selectedIds.size > 0 && (
                <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg flex flex-wrap items-center gap-3 animate-fade-in">
                    <span className="text-sm font-semibold text-primary-700 dark:text-primary-300 whitespace-nowrap">{t('bulkEdit')} ({selectedIds.size})</span>
                    <select 
                        value={bulkField}
                        onChange={(e) => setBulkField(e.target.value as keyof Sample)}
                        className="text-sm p-1.5 rounded border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800"
                    >
                        <option value="line">{t('line')}</option>
                        <option value="pit">{t('pit')}</option>
                        <option value="sterileDepth">{t('sterileDepth')}</option>
                        <option value="gravelDepth">{t('gravelDepth')}</option>
                        <option value="area">{t('area')}</option>
                        <option value="stones">{t('stones')}</option>
                        <option value="carats">{t('carats')}</option>
                    </select>
                    
                    <select
                        value={bulkOperation}
                        onChange={(e) => setBulkOperation(e.target.value as 'set' | 'add')}
                        className="text-sm p-1.5 rounded border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800"
                    >
                        <option value="set">{t('setValue')}</option>
                        <option value="add">{t('addValue')}</option>
                    </select>

                    <input
                        type="text"
                        value={bulkValue}
                        onChange={(e) => setBulkValue(e.target.value)}
                        placeholder="Value"
                        className="text-sm p-1.5 w-24 rounded border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800"
                    />

                    <button onClick={applyBulkEdit} className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded hover:bg-primary-700">
                        {t('apply')}
                    </button>
                </div>
            )}

            <div className="overflow-x-auto max-h-[65vh] overflow-y-auto rounded-lg border border-secondary-200 dark:border-secondary-700 relative">
                <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
                    <thead className="bg-secondary-50 dark:bg-secondary-800 sticky top-0 z-10 shadow-sm">
                        <tr>
                            {isEditing && (
                                <th className="px-4 py-3 text-left w-10 bg-secondary-50 dark:bg-secondary-800">
                                    <input type="checkbox" checked={selectedIds.size === samples.length && samples.length > 0} onChange={toggleSelectAll} className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50" />
                                </th>
                            )}
                            <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 tracking-wider bg-secondary-50 dark:bg-secondary-800">{t('no')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 tracking-wider bg-secondary-50 dark:bg-secondary-800">{t('line')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 tracking-wider bg-secondary-50 dark:bg-secondary-800">{t('pit')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 tracking-wider bg-secondary-50 dark:bg-secondary-800">{t('sterileDepth')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 tracking-wider bg-secondary-50 dark:bg-secondary-800">{t('gravelDepth')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 tracking-wider bg-secondary-50 dark:bg-secondary-800">{t('area')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 tracking-wider bg-secondary-50 dark:bg-secondary-800">{t('volume')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 tracking-wider bg-secondary-50 dark:bg-secondary-800">{t('stones')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 tracking-wider bg-secondary-50 dark:bg-secondary-800">{t('carats')}</th>
                            {isEditing && <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 tracking-wider bg-secondary-50 dark:bg-secondary-800">{t('actions')}</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-secondary-900 divide-y divide-secondary-200 dark:divide-secondary-800">
                        {samples.map((sample, index) => (
                            <tr key={sample.id} className={`hover:bg-secondary-50 dark:hover:bg-secondary-800/50 ${selectedIds.has(sample.id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                                {isEditing && (
                                    <td className="px-4 py-2">
                                         <input type="checkbox" checked={selectedIds.has(sample.id)} onChange={() => toggleSelection(sample.id)} className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50" />
                                    </td>
                                )}
                                <td className="px-4 py-2 whitespace-nowrap text-sm">{index + 1}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">{renderCell(sample, 'line', 'text')}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">{renderCell(sample, 'pit', 'text')}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">{renderCell(sample, 'sterileDepth', 'number')}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">{renderCell(sample, 'gravelDepth', 'number')}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">{renderCell(sample, 'area', 'number')}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">{((sample.sterileDepth + sample.gravelDepth) * sample.area).toFixed(2)}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">{renderCell(sample, 'stones', 'number')}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">{renderCell(sample, 'carats', 'number')}</td>
                                {isEditing && (
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                                        <button onClick={() => onRemoveSample(sample.id)} className="text-red-500 hover:text-red-700">
                                            {t('remove')}
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DataTable;
