
import React, { useContext } from 'react';
import { ProjectContext } from '../contexts/ProjectContext';

interface FinancialAnalysisProps {
    t: (key: string) => string;
}

const ResultDisplay: React.FC<{ label: string; value: string; isPositive?: boolean }> = ({ label, value, isPositive }) => {
    let valueColor = "text-secondary-900 dark:text-secondary-100";
    if (isPositive !== undefined) {
        valueColor = isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
    }

    return (
        <div className="flex justify-between items-center py-2 border-b border-secondary-200 dark:border-secondary-700">
            <span className="text-sm text-secondary-600 dark:text-secondary-400">{label}</span>
            <span className={`text-md font-bold ${valueColor}`}>{value}</span>
        </div>
    );
}

const FinancialAnalysis: React.FC<FinancialAnalysisProps> = ({ t }) => {
    const context = useContext(ProjectContext);
    if (!context) throw new Error("FinancialAnalysis must be used within a ProjectProvider");
    const { economicParams: params, setEconomicParams: setParams, financialResult: result } = context;

    const handleParamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setParams(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h3 className="text-xl font-bold mb-4">{t('blockEconomy')}</h3>
                <div className="bg-secondary-50 dark:bg-secondary-800/50 p-4 rounded-lg">
                    <ResultDisplay label={t('recoveredCarats')} value={`${result.recoveredCarats.toLocaleString(undefined, { maximumFractionDigits: 2 })} ct`} />
                    <ResultDisplay label={t('estimatedRevenue')} value={`$${result.estimatedRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
                    <ResultDisplay label={t('totalCost')} value={`$${result.totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
                    <ResultDisplay label={t('estimatedProfit')} value={`$${result.estimatedProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} isPositive={result.estimatedProfit >= 0}/>
                    <ResultDisplay 
                        label={t('economicViability')} 
                        value={result.isViable ? `✅ ${t('projectViable')}` : `❌ ${t('projectNotViable')}`} 
                        isPositive={result.isViable} 
                    />
                </div>
            </div>
            <div>
                 <div className="mt-0">
                    <h3 className="text-xl font-bold mb-4">{t('sensitivityAnalysis')}</h3>
                    <div className="space-y-4 bg-secondary-50 dark:bg-secondary-800/50 p-4 rounded-lg">
                        <div>
                            <label className="text-sm font-medium">{t('diamondPrice')}: ${params.diamondPrice.toFixed(2)}</label>
                            <input type="range" min="100" max="1000" step="10" value={params.diamondPrice} name="diamondPrice" onChange={handleParamChange} className="w-full h-2 bg-secondary-200 rounded-lg appearance-none cursor-pointer dark:bg-secondary-700" />
                        </div>
                         <div>
                            <label className="text-sm font-medium">{t('sterileRemovalCost')}: ${params.sterileRemovalCost.toFixed(2)}</label>
                            <input type="range" min="1" max="20" step="0.5" value={params.sterileRemovalCost} name="sterileRemovalCost" onChange={handleParamChange} className="w-full h-2 bg-secondary-200 rounded-lg appearance-none cursor-pointer dark:bg-secondary-700" />
                        </div>
                         <div>
                            <label className="text-sm font-medium">{t('processingCost')}: ${params.processingCost.toFixed(2)}</label>
                            <input type="range" min="5" max="50" step="1" value={params.processingCost} name="processingCost" onChange={handleParamChange} className="w-full h-2 bg-secondary-200 rounded-lg appearance-none cursor-pointer dark:bg-secondary-700" />
                        </div>
                        <div>
                             <label className="text-sm font-medium">{t('recoveryRate')}: {params.recoveryRate.toFixed(0)}%</label>
                            <input type="range" min="80" max="100" step="1" value={params.recoveryRate} name="recoveryRate" onChange={handleParamChange} className="w-full h-2 bg-secondary-200 rounded-lg appearance-none cursor-pointer dark:bg-secondary-700" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinancialAnalysis;
