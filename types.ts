
export type Language = 'pt' | 'en' | 'es';

export interface Project {
  userName: string;
  blockId: string;
  projectName: string;
  projectDescription: string;
  date: string;
  swellFactorSterile: number;
  swellFactorGravel: number;
  dilutionFactor: number;
}

export interface ProjectSettings {
  defaultCurrency: string;
  unitSystem: 'metric' | 'imperial';
}

export interface Sample {
  id: number;
  line: string;
  pit: string;
  sterileDepth: number;
  gravelDepth: number;
  area: number;
  stones: number;
  carats: number;
}

export interface EconomicParams {
    diamondPrice: number;
    sterileRemovalCost: number;
    gravelTransportCost: number;
    processingCost: number;
    transportDistance: number;
    recoveryRate: number;
}

export interface CalculatedReserves {
    prospectingData: {
        totalPitArea: number;
        avgSterileDepth: number;
        avgGravelDepth: number;
        totalStones: number;
        totalCarats: number;
        stonesPerSqm: number;
        avgStoneSize: number;
    };
    inSituReserves: {
        sterileVolume: number;
        gravelVolume: number;
        estimatedCarats: number;
        caratsPerSqm: number;
        caratsPerCbm: number;
        estimatedStones: number;
    };
    swelledAndDilutedReserves: {
        swelledSterileVolume: number;
        swelledGravelVolume: number;
        avgGrade: number;
        stripRatio: number;
    };
}

export interface FinancialResult {
    recoveredCarats: number;
    estimatedRevenue: number;
    totalCost: number;
    estimatedProfit: number;
    isViable: boolean;
}

export interface ProjectListItem {
  id: string;
  name: string;
}

export interface ProjectData {
    project: Project;
    totalBlockArea: number;
    samples: Sample[];
    economicParams: EconomicParams;
    settings: ProjectSettings;
}
