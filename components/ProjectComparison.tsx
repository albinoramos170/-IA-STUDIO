
import React, { useContext, useEffect, useState } from 'react';
import { ProjectContext } from '../contexts/ProjectContext';
import { apiService } from '../services/apiService';
import { calculateReserves, calculateFinancials } from '../utils/calculations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface ProjectComparisonProps {
    t: (key: string) => string;
}

interface ComparisonData {
    id: string;
    name: string;
    revenue: number;
    cost: number;
    profit: number;
    roi: number;
    isViable: boolean;
}

const CustomTooltipStyle = {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    border: '1px solid rgba(100, 116, 139, 0.5)',
    color: '#f1f5f9',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    padding: '8px 12px',
    fontSize: '12px',
};

const ProjectComparison: React.FC<ProjectComparisonProps> = ({ t }) => {
    const context = useContext(ProjectContext);
    if (!context) throw new Error("ProjectComparison must be used within a ProjectProvider");
    const { projects } = context;

    const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const allData: ComparisonData[] = [];
                for (const projListItem of projects) {
                    const fullData = await apiService.getProjectData(projListItem.id);
                    if (fullData) {
                        const reserves = calculateReserves(
                            fullData.samples, 
                            fullData.totalBlockArea, 
                            fullData.project
                        );
                        const financials = calculateFinancials(reserves, fullData.economicParams);
                        
                        allData.push({
                            id: projListItem.id,
                            name: fullData.project.projectName || projListItem.name,
                            revenue: financials.estimatedRevenue,
                            cost: financials.totalCost,
                            profit: financials.estimatedProfit,
                            roi: financials.totalCost > 0 ? (financials.estimatedProfit / financials.totalCost) * 100 : 0,
                            isViable: financials.isViable
                        });
                    }
                }
                setComparisonData(allData);
                setSelectedProjectIds(new Set(allData.map(d => d.id)));
            } catch (err) {
                console.error("Error fetching project data for comparison", err);
            } finally {
                setLoading(false);
            }
        };

        if (projects.length > 0) {
            fetchData();
        }
    }, [projects]);

    const toggleProject = (id: string) => {
        setSelectedProjectIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedProjectIds.size === comparisonData.length) {
            setSelectedProjectIds(new Set());
        } else {
            setSelectedProjectIds(new Set(comparisonData.map(d => d.id)));
        }
    };

    const filteredData = comparisonData.filter(d => selectedProjectIds.has(d.id));
    const projectsToDisplayInSelector = comparisonData.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg text-secondary-600 dark:text-secondary-400 font-medium animate-pulse">
                    {t('loadingData')}
                </div>
            </div>
        );
    }

    if (comparisonData.length === 0) {
        return <div className="p-4">{t('noProjectsFound')}</div>;
    }

    const formatCurrency = (val: number) => `$${(val/1000).toFixed(0)}k`;
    const formatFullCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div className="space-y-8 pb-8">
            {/* Project Selector */}
            <div className="bg-white dark:bg-secondary-900 p-4 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-800">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-3 md:space-y-0">
                    <h3 className="text-md font-semibold text-secondary-700 dark:text-secondary-300">{t('selectProjectsToCompare')}</h3>
                    <div className="flex items-center space-x-4 w-full md:w-auto">
                         <div className="relative flex-1 md:flex-none md:w-64">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-secondary-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-1.5 border border-secondary-300 dark:border-secondary-700 rounded-md leading-5 bg-secondary-50 dark:bg-secondary-800 placeholder-secondary-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                placeholder={t('searchPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button onClick={toggleSelectAll} className="text-sm text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap">
                            {selectedProjectIds.size === comparisonData.length ? "Unselect All" : "Select All"}
                        </button>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {projectsToDisplayInSelector.length > 0 ? (
                        projectsToDisplayInSelector.map(p => (
                            <button
                                key={p.id}
                                onClick={() => toggleProject(p.id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                                    selectedProjectIds.has(p.id)
                                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800'
                                        : 'bg-secondary-50 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 border-secondary-200 dark:border-secondary-700 hover:bg-secondary-100 dark:hover:bg-secondary-700'
                                }`}
                            >
                                {p.name}
                            </button>
                        ))
                    ) : (
                        <p className="text-sm text-secondary-500 p-2">No projects found.</p>
                    )}
                </div>
            </div>

            {/* Economic Comparison Chart */}
            <div className="bg-white dark:bg-secondary-900 p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold mb-6 text-primary-700 dark:text-primary-300">{t('economicComparison')}</h3>
                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={filteredData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                            <XAxis dataKey="name" fontSize={12} />
                            <YAxis tickFormatter={formatCurrency} fontSize={12} />
                            <Tooltip 
                                contentStyle={CustomTooltipStyle} 
                                formatter={(value: number) => [`$${value.toLocaleString(undefined, {maximumFractionDigits: 0})}`, '']}
                            />
                            <Legend />
                            <Bar dataKey="revenue" name={t('revenue')} fill="#0ea5e9" />
                            <Bar dataKey="cost" name={t('cost')} fill="#ef4444" />
                            <Bar dataKey="profit" name={t('profit')} fill="#22c55e" />
                            <ReferenceLine y={0} stroke="#666" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Visual Comparison Cards */}
            <div className="bg-white dark:bg-secondary-900 p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold mb-6 text-primary-700 dark:text-primary-300">{t('visualComparison')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredData.map((project) => (
                        <div key={project.id} className="bg-secondary-50 dark:bg-secondary-800 rounded-xl p-5 border border-secondary-200 dark:border-secondary-700 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="font-bold text-lg text-secondary-900 dark:text-white truncate pr-2" title={project.name}>{project.name}</h4>
                                <span className={`px-2 py-1 text-xs font-bold rounded uppercase tracking-wide ${
                                    project.isViable 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                }`}>
                                    {project.isViable ? 'VIABLE' : 'NOT VIABLE'}
                                </span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-secondary-500 dark:text-secondary-400">{t('revenue')}</span>
                                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{formatFullCurrency(project.revenue)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-secondary-500 dark:text-secondary-400">{t('cost')}</span>
                                    <span className="text-sm font-semibold text-red-500 dark:text-red-400">{formatFullCurrency(project.cost)}</span>
                                </div>
                                <div className="pt-2 border-t border-secondary-200 dark:border-secondary-700 flex justify-between items-center">
                                    <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">{t('profit')}</span>
                                    <span className={`text-lg font-bold ${project.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {formatFullCurrency(project.profit)}
                                    </span>
                                </div>
                                 <div className="flex justify-between items-center">
                                    <span className="text-xs text-secondary-500 dark:text-secondary-400">{t('roi')}</span>
                                    <span className={`text-xs font-bold ${project.roi >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {project.roi.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Detailed Viability List */}
            <div className="bg-white dark:bg-secondary-900 p-6 rounded-xl shadow-lg overflow-hidden">
                <h3 className="text-xl font-bold mb-6 text-primary-700 dark:text-primary-300">{t('detailedList')}</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
                        <thead className="bg-secondary-50 dark:bg-secondary-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">{t('projectName')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">{t('revenue')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">{t('cost')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">{t('profit')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">{t('roi')}</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">{t('status')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-secondary-900 divide-y divide-secondary-200 dark:divide-secondary-800">
                            {filteredData.map((project) => (
                                <tr key={project.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900 dark:text-secondary-100">{project.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-secondary-600 dark:text-secondary-300">{formatFullCurrency(project.revenue)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-secondary-600 dark:text-secondary-300">{formatFullCurrency(project.cost)}</td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${project.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {formatFullCurrency(project.profit)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-secondary-600 dark:text-secondary-300">{project.roi.toFixed(2)}%</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            project.isViable 
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                        }`}>
                                            {project.isViable ? t('projectViable') : t('projectNotViable')}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProjectComparison;
