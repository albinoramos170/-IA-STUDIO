import { Sample, Project, CalculatedReserves, EconomicParams, FinancialResult } from '../types';

export const calculateReserves = (
  samples: Sample[], 
  totalBlockArea: number, 
  project: Project
): CalculatedReserves => {
    const numSamples = samples.length;
    if (numSamples === 0) {
        return {
            prospectingData: { totalPitArea: 0, avgSterileDepth: 0, avgGravelDepth: 0, totalStones: 0, totalCarats: 0, stonesPerSqm: 0, avgStoneSize: 0 },
            inSituReserves: { sterileVolume: 0, gravelVolume: 0, estimatedCarats: 0, caratsPerSqm: 0, caratsPerCbm: 0, estimatedStones: 0 },
            swelledAndDilutedReserves: { swelledSterileVolume: 0, swelledGravelVolume: 0, avgGrade: 0, stripRatio: 0 }
        };
    }

    const totalPitArea = samples.reduce((sum, s) => sum + s.area, 0);
    const totalSterileDepth = samples.reduce((sum, s) => sum + s.sterileDepth, 0);
    const totalGravelDepth = samples.reduce((sum, s) => sum + s.gravelDepth, 0);
    const totalStones = samples.reduce((sum, s) => sum + s.stones, 0);
    const totalCarats = samples.reduce((sum, s) => sum + s.carats, 0);

    const avgSterileDepth = totalSterileDepth / numSamples;
    const avgGravelDepth = totalGravelDepth / numSamples;
    
    // --- Reservas in situ ---
    
    // "Volume de Estéril = Espessura média de estéril × Área do bloco"
    const inSituSterileVolume = avgSterileDepth * totalBlockArea;
    
    // "Volume de Cascalho = Espessura média de cascalho × Área do bloco"
    const inSituGravelVolume = avgGravelDepth * totalBlockArea;
    
    // "Quilates totais estimados (Q) = (quilates totais dos poços × área do bloco) / área total dos poços"
    const estimatedCarats = totalPitArea > 0 ? (totalCarats * totalBlockArea) / totalPitArea : 0;
    
    // "Quilates/m² = Q / área do bloco"
    const caratsPerSqm = totalBlockArea > 0 ? estimatedCarats / totalBlockArea : 0;
    
    // "Quilates/m³ = Q / volume de minério"
    // Assuming "volume de minério" refers to In Situ Gravel Volume
    const caratsPerCbm = inSituGravelVolume > 0 ? estimatedCarats / inSituGravelVolume : 0;
    
    // "Pedras estimadas = (nº total de pedras × área do bloco) / área total dos poços"
    const estimatedStones = totalPitArea > 0 ? (totalStones * totalBlockArea) / totalPitArea : 0;
    
    
    // --- Reservas Empoladas e Diluídas ---
    
    // "Volume de Estéril empolado = Volume de estéril × fator de empolamento"
    const swelledSterileVolume = inSituSterileVolume * project.swellFactorSterile;
    
    // "Volume de Cascalho empolado/diluído = ((fator de diluição + espessura média de cascalho) × fator de empolamento de cascalho × área do bloco)"
    // Using /100 to convert potential cm input to meters or percentage based skin.
    const dilutionValue = project.dilutionFactor / 100;
    const swelledGravelVolume = ((dilutionValue + avgGravelDepth) * project.swellFactorGravel * totalBlockArea);
    
    // "Quilates/m³ (diluído) = Quilates / volume do minério empolado e diluído"
    const dilutedGrade = swelledGravelVolume > 0 ? estimatedCarats / swelledGravelVolume : 0;
    
    // "Relação estéril/minério (S/R) = Volume de estéril / Volume de cascalho"
    // Using swelled volumes
    const stripRatio = swelledGravelVolume > 0 ? swelledSterileVolume / swelledGravelVolume : 0;
    
    return {
        prospectingData: {
            totalPitArea,
            avgSterileDepth,
            avgGravelDepth,
            totalStones,
            totalCarats,
            stonesPerSqm: totalPitArea > 0 ? totalStones / totalPitArea : 0,
            avgStoneSize: totalStones > 0 ? totalCarats / totalStones : 0,
        },
        inSituReserves: {
            sterileVolume: inSituSterileVolume,
            gravelVolume: inSituGravelVolume,
            estimatedCarats,
            caratsPerSqm,
            caratsPerCbm,
            estimatedStones,
        },
        swelledAndDilutedReserves: {
            swelledSterileVolume,
            swelledGravelVolume,
            avgGrade: dilutedGrade,
            stripRatio,
        }
    };
};

export const calculateFinancials = (
  reserves: CalculatedReserves, 
  economicParams: EconomicParams
): FinancialResult => {
    const { inSituReserves, swelledAndDilutedReserves: { swelledGravelVolume, swelledSterileVolume } } = reserves;
    
    const recoveredCarats = inSituReserves.estimatedCarats * (economicParams.recoveryRate / 100);
    const estimatedRevenue = recoveredCarats * economicParams.diamondPrice;

    const costRemoval = swelledSterileVolume * economicParams.sterileRemovalCost;
    const costTransport = swelledGravelVolume * economicParams.gravelTransportCost * economicParams.transportDistance;
    const costProcessing = swelledGravelVolume * economicParams.processingCost;
    const totalCost = costRemoval + costTransport + costProcessing;

    const estimatedProfit = estimatedRevenue - totalCost;

    return {
        recoveredCarats,
        estimatedRevenue,
        totalCost,
        estimatedProfit,
        isViable: estimatedProfit > 0,
    };
};