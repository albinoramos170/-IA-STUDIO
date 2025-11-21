import { GoogleGenAI } from "@google/genai";
import { Project, CalculatedReserves, FinancialResult, EconomicParams } from '../types';

// Access process.env.API_KEY directly as expected by the environment
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will be disabled.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const generateReport = async (
  project: Project,
  reserves: CalculatedReserves,
  financials: FinancialResult,
  params: EconomicParams,
  totalBlockArea: number,
  t: (key: string) => string
): Promise<string> => {
  if (!ai) {
    return "Error: Gemini API key is not configured.";
  }
  
  const prompt = `
    Act as a senior mining engineer and geologist. Based on the data below, write a comprehensive and professional technical and economic feasibility report for a secondary diamond deposit. The report should be well-structured, starting with an executive summary, followed by detailed sections on geological reserves and economic analysis. Conclude with a clear recommendation on the project's viability.

    **Project Details:**
    - Project Name: ${project.projectName}
    - Block ID: ${project.blockId}
    - Total Block Area: ${totalBlockArea.toFixed(2)} m²

    **Geological Reserve Estimation:**
    - **Prospecting Summary:**
      - Total Area Sampled: ${reserves.prospectingData.totalPitArea.toFixed(2)} m²
      - Average Sterile Thickness: ${reserves.prospectingData.avgSterileDepth.toFixed(2)} m
      - Average Gravel (Ore) Thickness: ${reserves.prospectingData.avgGravelDepth.toFixed(2)} m
      - Total Carats Found in Samples: ${reserves.prospectingData.totalCarats.toFixed(3)} ct
    - **In-Situ Reserves:**
      - In-Situ Sterile Volume: ${reserves.inSituReserves.sterileVolume.toFixed(2)} m³
      - In-Situ Gravel (Ore) Volume: ${reserves.inSituReserves.gravelVolume.toFixed(2)} m³
      - Estimated Total Carats: ${reserves.inSituReserves.estimatedCarats.toFixed(2)} ct
      - In-Situ Grade: ${reserves.inSituReserves.caratsPerCbm.toFixed(3)} ct/m³
    - **Mineable Reserves (with Swell & Dilution):**
      - Swelled Sterile Volume to be Moved: ${reserves.swelledAndDilutedReserves.swelledSterileVolume.toFixed(2)} m³
      - Swelled & Diluted Gravel (Ore) Volume to be Processed: ${reserves.swelledAndDilutedReserves.swelledGravelVolume.toFixed(2)} m³
      - Average Grade to Plant (Diluted): ${reserves.swelledAndDilutedReserves.avgGrade.toFixed(3)} ct/m³
      - Strip Ratio (Sterile/Ore): ${reserves.swelledAndDilutedReserves.stripRatio.toFixed(2)}

    **Economic Analysis:**
    - **Key Parameters:**
      - Average Diamond Price: $${params.diamondPrice.toFixed(2)} /ct
      - Recovery Rate: ${params.recoveryRate}%
      - Sterile Removal Cost: $${params.sterileRemovalCost.toFixed(2)} /m³
      - Ore Transport Cost: $${params.gravelTransportCost.toFixed(2)} /m³/km
      - Ore Processing Cost: $${params.processingCost.toFixed(2)} /m³
      - Transport Distance: ${params.transportDistance} km
    - **Financial Projections:**
      - Total Recovered Carats: ${financials.recoveredCarats.toFixed(2)} ct
      - Estimated Revenue: $${financials.estimatedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      - Total Operating Cost: $${financials.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      - Estimated Profit/Loss: $${financials.estimatedProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

    **Conclusion:**
    - Project Viability: ${financials.isViable ? t('projectViable') : t('projectNotViable')}

    Please generate the report now.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating report:", error);
    return "An error occurred while generating the report. Please check the console for details.";
  }
};

export const analyzeGraphs = async (
  chartDataSummary: string,
  t: (key: string) => string
): Promise<string> => {
  if (!ai) {
    return "Error: Gemini API key is not configured.";
  }

  const prompt = `
    Act as a senior data analyst and mining engineer. Analyze the following summary of graphical data from a diamond deposit simulation.
    Provide a concise interpretation of the trends, highlighting anomalies, favorable conditions, and potential risks.
    Focus on:
    1. Volume relationships (Stripping ratio implications).
    2. Grade distribution (Is it erratic or consistent?).
    3. Correlation between depth/area and grade.

    **Data Summary:**
    ${chartDataSummary}

    Provide the interpretation in the user's language.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error analyzing graphs:", error);
    return "An error occurred while analyzing the graphs.";
  }
};