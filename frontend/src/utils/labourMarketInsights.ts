export type LabourMetricId = 'unemployment_rate' | 'labour_force_participation' | 'employment_to_population'

export type LabourMarketRecord = {
  country: string
  country_code: string
  year: number
  metric: string
  value: number
  unit: string
  source_name: string
  source_url: string
  definition: string
  methodology: string
  industry: string
  geography: string
  notes: string
}

export type LabourMetricComparison = {
  metric: LabourMetricId
  year: number
  india: LabourMarketRecord
  unitedStates: LabourMarketRecord
  difference: number
}

export const labourMetricLabels: Record<LabourMetricId, string> = {
  unemployment_rate: 'Unemployment Rate',
  labour_force_participation: 'Labour Force Participation',
  employment_to_population: 'Employment-to-Population Ratio',
}

export const labourMetricOrder: LabourMetricId[] = [
  'unemployment_rate',
  'labour_force_participation',
  'employment_to_population',
]

export function compareLabourMetric(records: LabourMarketRecord[], metric: LabourMetricId, year: number): LabourMetricComparison | null {
  const india = records.find((record) => record.country === 'India' && record.metric === metric && record.year === year)
  const unitedStates = records.find((record) => record.country === 'United States' && record.metric === metric && record.year === year)
  if (!india || !unitedStates || india.unit !== unitedStates.unit || india.definition !== unitedStates.definition || india.methodology !== unitedStates.methodology) return null
  return { metric, year, india, unitedStates, difference: Math.abs(india.value - unitedStates.value) }
}
