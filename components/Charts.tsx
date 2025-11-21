import React, { useState, useContext } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Brush } from 'recharts';
import { ProjectContext } from '../contexts/ProjectContext';

interface ChartsProps {
    t: (key: string) => string;
}

const ChartContainer: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="h-72">
        <h4 className="text-center font-semibold text-sm mb-2">{title}</h4>
        {children}
    </div>
);

const CustomTooltipStyle = {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    border: '1px solid rgba(100, 116, 139, 0.5)',
    color: '#f1f5f9',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};


const Charts: React.FC<ChartsProps> = ({ t }) => {
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

    const volumeData = [
        { name: t('sterile'), [t('inSitu')]: inSituReserves.sterileVolume, [t('swelled')]: swelledAndDilutedReserves.swelledSterileVolume },
        { name: t('gravel'), [t('inSitu')]: inSituReserves.gravelVolume, [t('swelled')]: swelledAndDilutedReserves.swelledGravelVolume },
    ];

    const pieData = [
        { name: t('sterile'), value: swelledAndDilutedReserves.swelledSterileVolume },
        { name: t('gravel'), value: swelledAndDilutedReserves.swelledGravelVolume },
    ];
    
    const filteredPieData = pieData.filter(entry => pieVisibility[entry.name as keyof typeof pieVisibility]);
    const totalVisibleSwelledVolume = filteredPieData.reduce((sum, entry) => sum + entry.value, 0);
    
    const gradeData = samples.map(s => ({
        name: s.pit,
        grade: s.area > 0 && s.gravelDepth > 0 ? s.carats / (s.area * s.gravelDepth) : 0,
    }));

    const COLORS = ['#0ea5e9', '#f97316'];

    const handleVolumeLegendClick = (data: any) => {
        const { dataKey } = data;
        setVolumeVisibility(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
    };

    const handlePieLegendClick = (data: any) => {
        const { value } = data;
        setPieVisibility(prev => ({...prev, [value]: !prev[value]}));
    };

    const renderVolumeLegendText = (value: string) => {
        const isVisible = volumeVisibility[value as keyof typeof volumeVisibility];
        return (
          <span className={`transition-colors cursor-pointer ${isVisible ? "text-secondary-700 dark:text-secondary-300" : "text-secondary-400 dark:text-secondary-500 line-through"}`}>
            {value}
          </span>
        );
      };
      
    const renderPieLegendText = (value: string) => {
        const isVisible = pieVisibility[value as keyof typeof pieVisibility];
        return (
          <span className={`transition-colors cursor-pointer ${isVisible ? "text-secondary-700 dark:text-secondary-300" : "text-secondary-400 dark:text-secondary-500 line-through"}`}>
            {value}
          </span>
        );
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold mb-4">{t('chartsAndSensitivity')}</h3>
            <div className="grid grid-cols-1 gap-12">
                <ChartContainer title={t('volumeComparison')}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={volumeData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                            <XAxis dataKey="name" fontSize={12} />
                            <YAxis fontSize={12} tickFormatter={(value) => `${(Number(value) / 1000).toFixed(0)}k`} />
                            <Tooltip contentStyle={CustomTooltipStyle} formatter={(value: number) => [`${value.toLocaleString(undefined, {maximumFractionDigits: 0})} m³`]} />
                            <Legend onClick={handleVolumeLegendClick} formatter={renderVolumeLegendText} />
                            <Bar dataKey={t('inSitu')} fill="#38bdf8" hide={!volumeVisibility[t('inSitu')]} />
                            <Bar dataKey={t('swelled')} fill="#0ea5e9" hide={!volumeVisibility[t('swelled')]}/>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer title={t('swelledReserveDistribution')}>
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={filteredPieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {filteredPieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={CustomTooltipStyle}
                                formatter={(value: number) => {
                                    const percent = totalVisibleSwelledVolume > 0 ? (value / totalVisibleSwelledVolume * 100).toFixed(1) : 0;
                                    return [`${value.toLocaleString(undefined, {maximumFractionDigits: 0})} m³ (${percent}%)`];
                                }}
                            />
                            <Legend onClick={handlePieLegendClick} formatter={renderPieLegendText} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer title={t('gradeVariationByPit')}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={gradeData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                            <XAxis dataKey="name" fontSize={12} tick={{ dy: 5 }} />
                            <YAxis fontSize={12} tickFormatter={(value) => Number(value).toFixed(2)} />
                            <Tooltip 
                                contentStyle={CustomTooltipStyle} 
                                formatter={(value: number) => [`${Number(value).toFixed(3)} ct/m³`, t('caratsPerCbm')]}
                                labelFormatter={(label) => `Pit: ${label}`}
                            />
                            <Bar dataKey="grade" fill="#82ca9d" name={t('caratsPerCbm')} />
                            <Brush dataKey="name" height={25} stroke="#0ea5e9" fill="rgba(14, 165, 233, 0.1)" y={230} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </div>
        </div>
    );
};

export default Charts;