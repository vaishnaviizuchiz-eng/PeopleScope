export type AiWorkforceRecord = {
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

export type AiUseComparison = {
  year: number
  indiaValue: number
  unitedStatesValue: number
  percentagePointDifference: number
  higherValueCountry: string | null
  definition: string
}

export function compareAiWorkplaceUse(records: AiWorkforceRecord[]): AiUseComparison | null {
  const india = records.find((record) => record.country === 'India' && record.metric === 'genai_workplace_use')
  const unitedStates = records.find((record) => record.country === 'United States' && record.metric === 'genai_workplace_use')
  if (!india || !unitedStates || india.year !== unitedStates.year || india.definition !== unitedStates.definition || india.methodology !== unitedStates.methodology) return null

  const difference = Math.abs(india.value - unitedStates.value)
  return {
    year: india.year,
    indiaValue: india.value,
    unitedStatesValue: unitedStates.value,
    percentagePointDifference: difference,
    higherValueCountry: india.value === unitedStates.value ? null : india.value > unitedStates.value ? 'India' : 'United States',
    definition: india.definition,
  }
}
