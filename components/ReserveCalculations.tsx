import React, { useContext } from 'react';
import { ProjectContext } from '../contexts/ProjectContext';

interface ReserveCalculationsProps {
    t: (key: string) => string;
}

const DataRow: React.FC<{ label: string; value: string | number; unit?: string }> = ({ label, value, unit }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-secondary-200 dark:border-secondary-800">
        <span className="text-sm text-secondary-600 dark:text-secondary-400">{label}</span>
        <span className="text-sm font-semibold text-secondary-800 dark:text-secondary-100">
            {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 3 }) : value} {unit}
        </span>
    </div>
);

const ReserveSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-secondary-50 dark:bg-secondary-800/50 p-4 rounded-lg">
        <h4 className="font-bold text-md mb-3 text-primary-600 dark:text-primary-400">{title}</h4>
        <div className="space-y-1">{children}</div>
    </div>
);


const ReserveCalculations: React.FC<ReserveCalculationsProps> = ({ t }) => {
    const context = useContext(ProjectContext);
    if (!context) throw new Error("ReserveCalculations must be used within a ProjectProvider");
    const { calculatedReserves: reserves } = context;
    const { prospectingData, inSituReserves, swelledAndDilutedReserves } = reserves;

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold mb-4">{t('estimatedReserves')}</h3>
            <div className="space-y-4">
                <ReserveSection title={t('prospectingData')}>
                    <DataRow label={t('totalPitArea')} value={prospectingData.totalPitArea} unit="m²" />
                    <DataRow label={t('avgSterileDepth')} value={prospectingData.avgSterileDepth} unit="m" />
                    <DataRow label={t('avgGravelDepth')} value={prospectingData.avgGravelDepth} unit="m" />
                    <DataRow label={t('totalStones')} value={prospectingData.totalStones} />
                    <DataRow label={t('totalCarats')} value={prospectingData.totalCarats} unit="ct" />
                    <DataRow label={t('stonesPerSqm')} value={prospectingData.stonesPerSqm.toFixed(2)} unit="stones/m²" />
                    <DataRow label={t('avgStoneSize')} value={prospectingData.avgStoneSize.toFixed(3)} unit="ct" />
                </ReserveSection>

                <ReserveSection title={t('inSituReserves')}>
                    <DataRow label={t('sterileVolume')} value={inSituReserves.sterileVolume} unit="m³" />
                    <DataRow label={t('gravelVolume')} value={inSituReserves.gravelVolume} unit="m³" />
                    <DataRow label={t('estimatedCarats')} value={inSituReserves.estimatedCarats} unit="ct" />
                    <DataRow label={t('caratsPerSqm')} value={inSituReserves.caratsPerSqm.toFixed(3)} unit="ct/m²" />
                    <DataRow label={t('caratsPerCbm')} value={inSituReserves.caratsPerCbm.toFixed(3)} unit="ct/m³" />
                    <DataRow label={t('estimatedStones')} value={inSituReserves.estimatedStones} />
                </ReserveSection>

                <ReserveSection title={t('swelledDilutedReserves')}>
                    <DataRow label={t('swelledSterileVolume')} value={swelledAndDilutedReserves.swelledSterileVolume} unit="m³" />
                    <DataRow label={t('swelledGravelVolume')} value={swelledAndDilutedReserves.swelledGravelVolume} unit="m³" />
                    <DataRow label={t('avgGrade')} value={swelledAndDilutedReserves.avgGrade.toFixed(3)} unit="ct/m³" />
                    <DataRow label={t('stripRatio')} value={swelledAndDilutedReserves.stripRatio.toFixed(2)} />
                </ReserveSection>
            </div>
        </div>
    );
};

export default ReserveCalculations;