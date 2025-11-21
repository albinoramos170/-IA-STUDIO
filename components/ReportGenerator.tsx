import React, { useState, useCallback, useContext } from 'react';
import { generateReport } from '../services/geminiService';
import { ProjectContext } from '../contexts/ProjectContext';

interface ReportGeneratorProps {
    t: (key: string) => string;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ t }) => {
    const context = useContext(ProjectContext);
    if (!context) throw new Error("ReportGenerator must be used within a ProjectProvider");
    const { project, calculatedReserves: reserves, financialResult: financials, economicParams: params, totalBlockArea } = context;

    const [report, setReport] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isCopied, setIsCopied] = useState<boolean>(false);

    const handleGenerateReport = useCallback(async () => {
        setIsLoading(true);
        setReport('');
        try {
            const generatedReport = await generateReport(project, reserves, financials, params, totalBlockArea, t);
            setReport(generatedReport);
        } catch (error) {
            console.error(error);
            setReport("Failed to generate report.");
        } finally {
            setIsLoading(false);
        }
    }, [project, reserves, financials, params, totalBlockArea, t]);
    
    const copyToClipboard = () => {
        navigator.clipboard.writeText(report);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div>
            <div className="flex items-center space-x-4">
                <button
                    onClick={handleGenerateReport}
                    disabled={isLoading}
                    className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-opacity-75 disabled:bg-primary-300 disabled:cursor-not-allowed transition duration-200"
                >
                    {isLoading ? t('generating') : t('generateReport')}
                </button>
                {isLoading && (
                     <div className="flex items-center space-x-2 text-secondary-600 dark:text-secondary-400">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>{t('generating')}</span>
                    </div>
                )}
            </div>

            {report && (
                <div className="mt-6 p-6 bg-secondary-50 dark:bg-secondary-800/50 rounded-lg border border-secondary-200 dark:border-secondary-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">{t('report')}</h3>
                         <button
                            onClick={copyToClipboard}
                            className="px-3 py-1.5 text-sm bg-secondary-200 dark:bg-secondary-700 rounded-md hover:bg-secondary-300 dark:hover:bg-secondary-600 transition duration-200"
                        >
                            {isCopied ? t('copied') : t('copyToClipboard')}
                        </button>
                    </div>
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-secondary-700 dark:text-secondary-300">
                        {report}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default ReportGenerator;