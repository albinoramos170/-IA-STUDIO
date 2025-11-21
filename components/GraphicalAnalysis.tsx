
import React, { useState, useContext } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Brush, ScatterChart, Scatter, Label } from 'recharts';
import { ProjectContext } from '../contexts/ProjectContext';
import ClipboardIcon from './icons/ClipboardIcon';
import { analyzeGraphs } from '../services/geminiService';

interface GraphicalAnalysisProps {
    t: (key: string) => string;
}

const copyToClipboardCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;

    const keys = Object.keys(data[0]);
    const csvContent = [
        keys.join(','),
        ...data.map(row => keys.map(key => {
             const val = row[key];
             return typeof val === 'string' ? `"${val}"` : val;
        }).join(','))
    ].join('\n');

    navigator.clipboard.writeText(csvContent).then(() => {
        // Could add a toast notification here, but for now reliance on UI feedback in button is enough
        alert("Data copied to clipboard as CSV!");
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
};

const ChartContainer: React.FC<{ title: string; children: React.ReactNode; className?: string; onCopy?: () => void; t: (key: string) => string }> = ({ title, children, className = "h-80", onCopy, t }) => (
    <div className={`${className} relative group`}>
        <div className="flex justify-center items-center mb-4 relative">
            <h4 className="text-center font-semibold text-md text-secondary-700 dark:text-secondary-300">{title}</h4>
            {onCopy && (
                <button 
                    onClick={onCopy}
                    className="absolute right-0 p-1.5 rounded-md text-secondary-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-secondary-700 transition-colors"
                    title={t('copyData')}
                >
                    <ClipboardIcon className="w-4 h-4" />
                </button>
            )}
        </div>
        {children}
    </div>
);

const CustomTooltipStyle = {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    border: '1px solid rgba(100, 116, 139, 0.5)',
    color: '#f1f5f9',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    padding: '8px 12px',
    fontSize: '12px',
};

const CustomTooltipArea = ({ active, payload, t }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={CustomTooltipStyle} className="p-2 text-sm">
          <p className="font-bold">{`Pit: ${data.pit}`}</p>
          <p>{`${t('caratsPerCbm')}: ${data.grade.toFixed(3)} ct/m³`}</p>
          <p>{`${t('area')}: ${data.area} m²`}</p>
          <p>{`${t('gravelDepth')}: ${data.depth} m`}</p>
        </div>
      );
    }
    return null;
};

const defaultColors = {
    inSitu: '#38bdf8',
    swelled: '#ec4899',
    sterile: '#0ea5e9',
    gravel: '#f97316',
    grade: '#82ca9d',
    scatterDepth: '#f97316',
    scatterArea: '#10b981',
};

const defaultTooltips = {
    volume: true,
    pie: true,
    gradePit: true,
    gradeDepth: true,
    gradeArea: true,
};

const GraphicalAnalysis: React.FC<GraphicalAnalysisProps> = ({ t }) => {
    const context = useContext(ProjectContext);
    if (!context) throw new Error("Charts must be used within a ProjectProvider");
    const { calculatedReserves: reserves, samples } = context;
    
    const { inSituReserves, swelledAndDilutedReserves } = reserves;
    
    const [volumeVisibility, setVolumeVisibility] = useState({
        [t('inSitu')]: true,
        [t('swelled')]: true,
    });
    
    const [pieVisibility, setPieVisibility] = useState({
        [t('sterile')]: true,
        [t('gravel')]: true,
    });

    const [colors, setColors] = useState(defaultColors);
    const [tooltips, setTooltips] = useState(defaultTooltips);
    const [showSettings, setShowSettings] = useState(false);
    
    // AI State
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const resetSettings = () => {
        setColors(defaultColors);
        setTooltips(defaultTooltips);
    };

    const volumeData = [
        { name: t('sterile'), [t('inSitu')]: inSituReserves.sterileVolume, [t('swelled')]: swelledAndDilutedReserves.swelledSterileVolume },
        { name: t('gravel'), [t('inSitu')]: inSituReserves.gravelVolume, [t('swelled')]: swelledAndDilutedReserves.swelledGravelVolume },
    ];

    const pieData = [
        { name: t('sterile'), value: swelledAndDilutedReserves.swelledSterileVolume },
        { name: t('gravel'), value: swelledAndDilutedReserves.swelledGravelVolume },
    ].filter(d => d.value > 0);
    
    const filteredPieData = pieData.filter(entry => pieVisibility[entry.name as keyof typeof pieVisibility]);
    const totalVisibleSwelledVolume = filteredPieData.reduce((sum, entry) => sum + entry.value, 0);
    
    const gradeData = samples.map(s => ({
        name: s.pit || `Sample ${s.id}`,
        grade: s.area > 0 && s.gravelDepth > 0 ? s.carats / (s.area * s.gravelDepth) : 0,
    }));

    const scatterDataDepth = samples.map(s => ({
        depth: s.gravelDepth,
        grade: s.area > 0 && s.gravelDepth > 0 ? s.carats / (s.area * s.gravelDepth) : 0,
        pit: s.pit || `Sample ${s.id}`,
    })).filter(s => s.depth > 0 && s.grade > 0);
    
    const scatterDataArea = samples.map(s => ({
        area: s.area,
        grade: s.area > 0 && s.gravelDepth > 0 ? s.carats / (s.area * s.gravelDepth) : 0,
        pit: s.pit || `Sample ${s.id}`,
        depth: s.gravelDepth,
    })).filter(s => s.area > 0 && s.grade > 0);

    const getPieColor = (name: string) => {
        if (name === t('sterile')) return colors.sterile;
        if (name === t('gravel')) return colors.gravel;
        return '#8884d8';
    };

    const handleVolumeLegendClick = (data: any) => {
        const { dataKey } = data;
        setVolumeVisibility(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
    };

    const handlePieLegendClick = (data: any) => {
        const { value } = data;
        setPieVisibility(prev => ({...prev, [value]: !prev[value]}));
    };

    const renderLegendText = (value: string, visibilityState: any) => {
        const isVisible = visibilityState[value as keyof typeof visibilityState];
        return (
          <span className={`transition-colors cursor-pointer ${isVisible ? "text-secondary-700 dark:text-secondary-300" : "text-secondary-400 dark:text-secondary-500 line-through"}`}>
            {value}
          </span>
        );
      };
      
    const handleAnalyzeGraphs = async () => {
        setIsAnalyzing(true);
        setAiAnalysis('');
        
        // Prepare summary data
        const summary = `
            Volume Comparison: Sterile (In Situ: ${inSituReserves.sterileVolume}, Swelled: ${swelledAndDilutedReserves.swelledSterileVolume}), Gravel (In Situ: ${inSituReserves.gravelVolume}, Swelled: ${swelledAndDilutedReserves.swelledGravelVolume}).
            Grade Statistics: Average Grade ${swelledAndDilutedReserves.avgGrade} ct/m³. Max Grade in sample: ${Math.max(...gradeData.map(d => d.grade))}. Min Grade: ${Math.min(...gradeData.map(d => d.grade))}.
            Sample Count: ${samples.length}.
            Correlation hints: Grade vs Depth data points: ${JSON.stringify(scatterDataDepth.map(d => ({d: d.depth, g: d.grade})))}.
        `;

        try {
            const result = await analyzeGraphs(summary, t);
            setAiAnalysis(result);
        } catch (error) {
            console.error(error);
            setAiAnalysis("Failed to analyze graphs.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div>
            <div className="mb-6 p-4 bg-secondary-100 dark:bg-secondary-800 rounded-lg">
                <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex items-center text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 focus:outline-none"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-2 transition-transform ${showSettings ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    {t('chartSettings')}
                </button>
                
                {showSettings && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h5 className="text-xs font-bold uppercase text-secondary-500 dark:text-secondary-400 mb-3">{t('chartColors')}</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    { label: t('inSituColor'), key: 'inSitu' },
                                    { label: t('swelledColor'), key: 'swelled' },
                                    { label: t('sterileColor'), key: 'sterile' },
                                    { label: t('gravelColor'), key: 'gravel' },
                                    { label: t('gradeColor'), key: 'grade' },
                                    { label: t('scatterDepthColor'), key: 'scatterDepth' },
                                    { label: t('scatterAreaColor'), key: 'scatterArea' },
                                ].map((item) => (
                                    <div key={item.key} className="flex items-center justify-between">
                                        <label className="text-sm text-secondary-600 dark:text-secondary-300">{item.label}</label>
                                        <input 
                                            type="color" 
                                            value={colors[item.key as keyof typeof colors]} 
                                            onChange={(e) => setColors(prev => ({ ...prev, [item.key]: e.target.value }))}
                                            className="h-8 w-10 rounded cursor-pointer border-0 p-0 bg-transparent" 
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h5 className="text-xs font-bold uppercase text-secondary-500 dark:text-secondary-400 mb-3">{t('showTooltips')}</h5>
                            <div className="space-y-2">
                                {[
                                    { label: t('volumeComparison'), key: 'volume' },
                                    { label: t('swelledReserveDistribution'), key: 'pie' },
                                    { label: t('gradeVariationByPit'), key: 'gradePit' },
                                    { label: t('gradeVsGravelDepth'), key: 'gradeDepth' },
                                    { label: t('gradeVsArea'), key: 'gradeArea' },
                                ].map((item) => (
                                    <div key={item.key} className="flex items-center">
                                        <input 
                                            type="checkbox" 
                                            id={`tooltip-${item.key}`}
                                            checked={tooltips[item.key as keyof typeof tooltips]} 
                                            onChange={(e) => setTooltips(prev => ({ ...prev, [item.key]: e.target.checked }))}
                                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded" 
                                        />
                                        <label htmlFor={`tooltip-${item.key}`} className="ml-2 text-sm text-secondary-600 dark:text-secondary-300">{item.label}</label>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 text-right">
                                <button onClick={resetSettings} className="text-xs text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300 underline">{t('reset')}</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                <ChartContainer title={t('volumeComparison')} onCopy={() => copyToClipboardCSV(volumeData, 'volume_data')} t={t}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={volumeData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                            <XAxis dataKey="name" fontSize={12} />
                            <YAxis fontSize={12} tickFormatter={(value) => `${(Number(value) / 1000).toFixed(0)}k`} />
                            {tooltips.volume && <Tooltip contentStyle={CustomTooltipStyle} formatter={(value: number) => [`${value.toLocaleString(undefined, {maximumFractionDigits: 0})} m³`]} />}
                            <Legend onClick={handleVolumeLegendClick} formatter={(value) => renderLegendText(value, volumeVisibility)} verticalAlign="top" height={36}/>
                            <Bar dataKey={t('inSitu')} fill={colors.inSitu} hide={!volumeVisibility[t('inSitu')]} />
                            <Bar dataKey={t('swelled')} fill={colors.swelled} hide={!volumeVisibility[t('swelled')]}/>
                            <Brush dataKey="name" height={30} stroke="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer title={t('swelledReserveDistribution')} onCopy={() => copyToClipboardCSV(filteredPieData, 'reserve_dist_data')} t={t}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={filteredPieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={100}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {filteredPieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={getPieColor(entry.name)} />
                                ))}
                            </Pie>
                            {tooltips.pie && (
                                <Tooltip 
                                    contentStyle={CustomTooltipStyle}
                                    formatter={(value: number) => {
                                        const percent = totalVisibleSwelledVolume > 0 ? (value / totalVisibleSwelledVolume * 100).toFixed(1) : 0;
                                        return [`${value.toLocaleString(undefined, {maximumFractionDigits: 0})} m³ (${percent}%)`];
                                    }}
                                />
                            )}
                            <Legend onClick={handlePieLegendClick} formatter={(value) => renderLegendText(value, pieVisibility)} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer title={t('gradeVariationByPit')} className="h-96 xl:col-span-2" onCopy={() => copyToClipboardCSV(gradeData, 'grade_data')} t={t}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={gradeData} margin={{ top: 5, right: 30, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                            <XAxis dataKey="name" fontSize={12} tick={{ dy: 5 }} angle={-20} textAnchor="end" height={50} />
                            <YAxis fontSize={12} tickFormatter={(value) => Number(value).toFixed(2)} />
                            {tooltips.gradePit && (
                                <Tooltip 
                                    contentStyle={CustomTooltipStyle} 
                                    formatter={(value: number) => [`${Number(value).toFixed(3)} ct/m³`, t('caratsPerCbm')]}
                                    labelFormatter={(label) => `Pit: ${label}`}
                                />
                            )}
                            <Bar dataKey="grade" fill={colors.grade} name={t('caratsPerCbm')} />
                            <Brush dataKey="name" height={30} stroke="#82ca9d" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer title={t('gradeVsGravelDepth')} className="h-96 xl:col-span-2" onCopy={() => copyToClipboardCSV(scatterDataDepth, 'grade_depth_data')} t={t}>
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 10 }}>
                            <CartesianGrid stroke="rgba(128, 128, 128, 0.2)" />
                            <XAxis type="number" dataKey="depth" name={t('gravelDepth')} unit="m" fontSize={12}>
                                <Label value={t('gravelDepth')} offset={-20} position="insideBottom" />
                            </XAxis>
                            <YAxis type="number" dataKey="grade" name={t('caratsPerCbm')} unit="ct/m³" fontSize={12}>
                                <Label value={t('caratsPerCbm')} angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                            </YAxis>
                            {tooltips.gradeDepth && (
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={CustomTooltipStyle} 
                                    formatter={(value: number, name: string) => [`${Number(value).toFixed(3)}`, name]}
                                    labelFormatter={(label) => `Depth: ${label}m`}
                                />
                            )}
                            <Scatter name="Samples" data={scatterDataDepth} fill={colors.scatterDepth} />
                        </ScatterChart>
                    </ResponsiveContainer>
                </ChartContainer>
                
                <ChartContainer title={t('gradeVsArea')} className="h-96 xl:col-span-2" onCopy={() => copyToClipboardCSV(scatterDataArea, 'grade_area_data')} t={t}>
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 10 }}>
                            <CartesianGrid stroke="rgba(128, 128, 128, 0.2)" />
                            <XAxis type="number" dataKey="area" name={t('area')} unit="m²" fontSize={12}>
                                <Label value={t('area')} offset={-20} position="insideBottom" />
                            </XAxis>
                            <YAxis type="number" dataKey="grade" name={t('caratsPerCbm')} unit="ct/m³" fontSize={12} tickFormatter={(tick) => tick.toFixed(2)}>
                                <Label value={t('caratsPerCbm')} angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                            </YAxis>
                            {tooltips.gradeArea && <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltipArea t={t} />} />}
                            <Scatter name="Samples" data={scatterDataArea} fill={colors.scatterArea} />
                        </ScatterChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </div>
            
            {/* AI Graph Interpretation Section */}
            <div className="mt-12 pt-8 border-t border-secondary-200 dark:border-secondary-700">
                <h3 className="text-xl font-bold mb-4 text-primary-700 dark:text-primary-300">{t('aiInterpretation')}</h3>
                
                {!aiAnalysis ? (
                    <button
                        onClick={handleAnalyzeGraphs}
                        disabled={isAnalyzing}
                        className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 flex items-center"
                    >
                         {isAnalyzing && (
                             <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                         )}
                        {isAnalyzing ? t('generating') : t('analyzeGraphs')}
                    </button>
                ) : (
                    <div className="bg-secondary-50 dark:bg-secondary-800/50 p-6 rounded-xl border border-secondary-200 dark:border-secondary-700 relative animate-fade-in">
                         <button
                            onClick={() => setAiAnalysis('')}
                            className="absolute top-4 right-4 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                        <div className="prose dark:prose-invert max-w-none">
                            <h4 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-2">Gemini Analysis</h4>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-secondary-700 dark:text-secondary-300">{aiAnalysis}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GraphicalAnalysis;
