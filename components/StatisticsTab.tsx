import React, { useContext, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, ResponsiveContainer, Cell
} from "recharts";
import { ProjectContext } from '../contexts/ProjectContext';

// UI Helper Components
const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-secondary-900 rounded-xl shadow-lg border border-secondary-200 dark:border-secondary-700 ${className}`}>{children}</div>
);

const CardHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-6 py-4 border-b border-secondary-200 dark:border-secondary-800">{children}</div>
);

const CardTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">{children}</h2>
);

const CardContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-6">{children}</div>
);

const AccordionItem: React.FC<{ title: string; children: React.ReactNode; isOpen: boolean; onToggle: () => void }> = ({ title, children, isOpen, onToggle }) => (
  <div className="border-b border-secondary-200 dark:border-secondary-700 last:border-0">
    <button
      onClick={onToggle}
      className="flex justify-between items-center w-full py-4 text-left font-medium text-secondary-700 dark:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors px-2 rounded focus:outline-none"
    >
      {title}
      <svg
        className={`w-5 h-5 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    {isOpen && (
      <div className="py-4 animate-fade-in">
        {children}
      </div>
    )}
  </div>
);

export default function StatisticsTab({ t }: { t: (key: string) => string }) {
  const context = useContext(ProjectContext);
  const [openItem, setOpenItem] = useState<string | null>("histograma");

  if (!context) return <div className="p-4">Loading context...</div>;
  
  const { samples, calculatedReserves, economicParams, financialResult } = context;

  // --- DATA PREPARATION ---

  // 1. Calculate Grades (Carats / m³) for each sample
  const grades = useMemo(() => {
    if (!samples || !Array.isArray(samples)) return [];
    return samples.map(s => {
      const area = Number(s.area) || 0;
      const depth = Number(s.gravelDepth) || 0;
      const carats = Number(s.carats) || 0;
      const vol = area * depth;
      // Avoid division by zero and infinite values
      return vol > 0.000001 ? carats / vol : 0;
    }).filter(g => isFinite(g) && g >= 0);
  }, [samples]);

  // 2. Histogram Data
  const histogramData = useMemo(() => {
    if (grades.length === 0) return [];
    const min = Math.min(...grades);
    const max = Math.max(...grades);
    
    if (Math.abs(max - min) < 0.0001) {
       return [{ faixa: `${min.toFixed(2)}`, valor: grades.length }];
    }
    
    const binCount = 10;
    const range = max - min;
    const binSize = range / binCount;
    
    // Initialize bins
    const bins = Array.from({ length: binCount }, (_, i) => {
       const start = min + i * binSize;
       const end = start + binSize;
       return {
         label: `${start.toFixed(2)}-${end.toFixed(2)}`,
         count: 0
       };
    });

    // Fill bins
    grades.forEach(g => {
       let binIndex = Math.floor((g - min) / binSize);
       if (binIndex >= binCount) binIndex = binCount - 1;
       if (binIndex < 0) binIndex = 0;
       
       if (bins[binIndex]) {
          bins[binIndex].count++;
       }
    });

    return bins.map(b => ({ faixa: b.label, valor: b.count }));
  }, [grades]);

  // 3. GT Curve
  const gtCurveData = useMemo(() => {
      if (grades.length === 0) return [];
      const sorted = [...grades].sort((a, b) => a - b);
      return sorted.map((g, i) => ({
          grade: g,
          cumulativo: ((i + 1) / sorted.length) * 100
      }));
  }, [grades]);

  // 4. Boxplot Stats
  const boxStats = useMemo(() => {
      if (grades.length === 0) return { min: 0, max: 0, q1: 0, median: 0, q3: 0 };
      const sorted = [...grades].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)] || 0;
      const median = sorted[Math.floor(sorted.length * 0.5)] || 0;
      const q3 = sorted[Math.floor(sorted.length * 0.75)] || 0;
      const min = sorted[0] || 0;
      const max = sorted[sorted.length - 1] || 0;
      return { min, max, q1, median, q3 };
  }, [grades]);

  // 5. ROM Analysis Data
  const romData = useMemo(() => {
      if (!calculatedReserves || !financialResult || !economicParams) return [];
      
      const swelledVol = calculatedReserves.swelledAndDilutedReserves?.swelledGravelVolume || 0;
      const avgGrade = calculatedReserves.swelledAndDilutedReserves?.avgGrade || 0;
      const recovery = economicParams.recoveryRate || 0;
      const recoveredCarats = financialResult.recoveredCarats || 0;
      const revenue = financialResult.estimatedRevenue || 0;

      return [
        { label: "Vol (m³)", value: swelledVol, unit: "m³" },
        { label: "Grade Avg", value: avgGrade, unit: "ct/m³" },
        { label: "Rec (%)", value: recovery, unit: "%" },
        { label: "Prod (ct)", value: recoveredCarats, unit: "ct" },
        { label: "Rev ($)", value: revenue, unit: "$" },
      ].map(item => ({
          ...item,
          value: Number(isFinite(item.value) ? item.value : 0)
      }));
  }, [calculatedReserves, economicParams, financialResult]);

  const toggle = (id: string) => setOpenItem(openItem === id ? null : id);
  
  const tooltipStyle = {
      backgroundColor: 'rgba(30, 41, 59, 0.95)',
      border: '1px solid rgba(71, 85, 105, 0.5)',
      color: '#f8fafc',
      borderRadius: '6px',
      fontSize: '12px'
  };

  if (!samples || samples.length === 0) {
    return <div className="p-6 text-center text-secondary-500">{t('noDataAvailable') || "No Data Available"}</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('statisticalAnalysis')}</CardTitle>
        </CardHeader>
        <CardContent>
            {/* HISTOGRAMA */}
            <AccordionItem title={t('gradeHistogram')} isOpen={openItem === 'histograma'} onToggle={() => toggle('histograma')}>
                <div className="h-80 w-full">
                  {histogramData.length > 0 ? (
                  <ResponsiveContainer width="99%" height="100%">
                    <BarChart data={histogramData} margin={{top: 20, right: 30, left: 0, bottom: 20}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                      <XAxis dataKey="faixa" fontSize={12} tick={{dy: 10}} />
                      <YAxis fontSize={12} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                      <Bar dataKey="valor" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Count" />
                    </BarChart>
                  </ResponsiveContainer>
                  ) : <div className="flex items-center justify-center h-full text-sm text-secondary-400">Insufficient Data</div>}
                </div>
            </AccordionItem>

            {/* GRADE CURVE */}
            <AccordionItem title={t('gradeCurve')} isOpen={openItem === 'gtcurve'} onToggle={() => toggle('gtcurve')}>
                <div className="h-80 w-full">
                  {gtCurveData.length > 1 ? (
                  <ResponsiveContainer width="99%" height="100%">
                    <LineChart data={gtCurveData} margin={{top: 20, right: 30, left: 0, bottom: 20}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                      <XAxis dataKey="grade" fontSize={12} label={{ value: 'Grade (ct/m³)', position: 'insideBottom', offset: -10, fill: '#888' }} />
                      <YAxis fontSize={12} label={{ value: 'Cumulative %', angle: -90, position: 'insideLeft', fill: '#888' }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line type="monotone" dataKey="cumulativo" stroke="#8b5cf6" strokeWidth={3} dot={false} activeDot={{r: 6}} />
                    </LineChart>
                  </ResponsiveContainer>
                   ) : <div className="flex items-center justify-center h-full text-sm text-secondary-400">Insufficient Data</div>}
                </div>
            </AccordionItem>

            {/* BOX PLOT */}
            <AccordionItem title={t('boxplotStats')} isOpen={openItem === 'boxplot'} onToggle={() => toggle('boxplot')}>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-6 bg-secondary-50 dark:bg-secondary-800/50 rounded-xl text-center border border-secondary-100 dark:border-secondary-700">
                  <div className="p-3 rounded-lg bg-white dark:bg-secondary-800 shadow-sm">
                    <div className="text-xs uppercase tracking-wider text-secondary-500 mb-1">Min</div>
                    <div className="text-xl font-bold text-secondary-900 dark:text-secondary-100">{boxStats.min.toFixed(3)}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white dark:bg-secondary-800 shadow-sm">
                    <div className="text-xs uppercase tracking-wider text-secondary-500 mb-1">Q1</div>
                    <div className="text-xl font-bold text-secondary-900 dark:text-secondary-100">{boxStats.q1.toFixed(3)}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 shadow-sm ring-2 ring-primary-500 ring-opacity-20">
                    <div className="text-xs uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-1 font-bold">Median</div>
                    <div className="text-2xl font-bold text-primary-700 dark:text-primary-300">{boxStats.median.toFixed(3)}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white dark:bg-secondary-800 shadow-sm">
                    <div className="text-xs uppercase tracking-wider text-secondary-500 mb-1">Q3</div>
                    <div className="text-xl font-bold text-secondary-900 dark:text-secondary-100">{boxStats.q3.toFixed(3)}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white dark:bg-secondary-800 shadow-sm">
                    <div className="text-xs uppercase tracking-wider text-secondary-500 mb-1">Max</div>
                    <div className="text-xl font-bold text-secondary-900 dark:text-secondary-100">{boxStats.max.toFixed(3)}</div>
                  </div>
                </div>
            </AccordionItem>

            {/* ROM */}
            <AccordionItem title={t('romAnalysis')} isOpen={openItem === 'rom'} onToggle={() => toggle('rom')}>
                <div className="h-80 w-full">
                  {romData.length > 0 ? (
                  <ResponsiveContainer width="99%" height="100%">
                    <BarChart data={romData} layout="vertical" margin={{top: 20, right: 50, left: 20, bottom: 20}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" horizontal={false} />
                      <XAxis type="number" fontSize={12} />
                      <YAxis dataKey="label" type="category" fontSize={12} width={80} tick={{fill: '#888'}} />
                      <Tooltip 
                        contentStyle={tooltipStyle} 
                        cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                        formatter={(val: number, name: string, props: any) => [`${typeof val === 'number' ? val.toLocaleString(undefined, {maximumFractionDigits: 2}) : val} ${props.payload.unit}`, 'Value']} 
                      />
                      <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={30} name="Value">
                         {romData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'][index % 5]} />
                         ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  ) : <div className="flex items-center justify-center h-full text-sm text-secondary-400">Insufficient Data</div>}
                </div>
            </AccordionItem>
        </CardContent>
      </Card>
    </div>
  );
}
