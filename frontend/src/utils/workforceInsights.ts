export type MetricId = 'employee_engagement' | 'employee_wellbeing' | 'daily_stress'

export type WorkforceObservation = {
  country: string
  year: number
  metric: MetricId
  value: number
  unit: string
  source_name: string
  source_url: string
}

export type MetricComparison = {
  metric: MetricId
  year: number
  countryA: string
  countryB: string
  valueA: number | null
  valueB: number | null
  absoluteDifference: number | null
  percentagePointDifference: number | null
  higherValueCountry: string | null
  sourceA?: { name: string; url: string }
  sourceB?: { name: string; url: string }
}

export type RuleInsight = {
  metric: MetricId
  text: string
  comparison: MetricComparison
}

export type HrFocusArea = {
  metric: MetricId
  title: string
  prompt: string
  comparison: MetricComparison
}

export const metricLabels: Record<MetricId, string> = {
  employee_engagement: 'Employee Engagement',
  employee_wellbeing: 'Employee Wellbeing',
  daily_stress: 'Daily Stress',
}

const metricOrder: MetricId[] = ['employee_engagement', 'employee_wellbeing', 'daily_stress']

export function calculateComparisons(
  observations: WorkforceObservation[],
  year: number,
  countryA: string,
  countryB: string,
): MetricComparison[] {
  return metricOrder.map((metric) => {
    const a = observations.find((row) => row.country === countryA && row.year === year && row.metric === metric)
    const b = observations.find((row) => row.country === countryB && row.year === year && row.metric === metric)
    const comparable = Boolean(a && b && a.unit === b.unit)
    const gap = comparable ? Math.abs(a!.value - b!.value) : null
    return {
      metric,
      year,
      countryA,
      countryB,
      valueA: a?.value ?? null,
      valueB: b?.value ?? null,
      absoluteDifference: gap,
      percentagePointDifference: comparable && a!.unit.toLowerCase() === 'percent' ? gap : null,
      higherValueCountry: !comparable || a!.value === b!.value ? null : a!.value > b!.value ? countryA : countryB,
      sourceA: a ? { name: a.source_name, url: a.source_url } : undefined,
      sourceB: b ? { name: b.source_name, url: b.source_url } : undefined,
    }
  })
}

export function generateRuleBasedInsights(comparisons: MetricComparison[]): RuleInsight[] {
  const insights: RuleInsight[] = []
  for (const comparison of comparisons) {
    const { metric, countryA, countryB, valueA, valueB, percentagePointDifference: gap } = comparison
    if (valueA === null || valueB === null || gap === null) continue
    const lowerCountry = valueA < valueB ? countryA : countryB
    const higherCountry = valueA > valueB ? countryA : countryB
    const text = valueA === valueB
      ? `${metricLabels[metric]} is equal in ${countryA} and ${countryB} at ${valueA}%.`
      : metric === 'daily_stress'
        ? `${higherCountry} reports higher daily stress by ${gap} percentage points compared with ${lowerCountry}.`
        : metric === 'employee_wellbeing'
          ? `Employee wellbeing is lower in ${lowerCountry} by ${gap} percentage points compared with ${higherCountry}.`
          : `Engagement is lower in ${lowerCountry} by ${gap} percentage points compared with ${higherCountry}.`
    insights.push({ metric, text, comparison })
  }
  return insights
}

export function generateHrFocusAreas(comparisons: MetricComparison[]): HrFocusArea[] {
  return comparisons.flatMap((comparison) => {
    const { metric, countryA, countryB, valueA, valueB, percentagePointDifference: gap } = comparison
    if (valueA === null || valueB === null || gap === null) return []
    const lowerCountry = valueA <= valueB ? countryA : countryB
    const higherCountry = valueA > valueB ? countryA : countryB
    const prompt = valueA === valueB
      ? `Potential area to investigate: ${metricLabels[metric].toLowerCase()} patterns in both countries (both observed values are ${valueA}%). The data do not identify a cause.`
      : metric === 'daily_stress'
        ? `Potential area to investigate: workplace stress in ${higherCountry}, where the observed value is ${Math.max(valueA, valueB)}% compared with ${Math.min(valueA, valueB)}% in ${lowerCountry}. The data do not identify a cause.`
        : `Potential area to investigate: ${metricLabels[metric].toLowerCase()} in ${lowerCountry}, where the observed value is ${Math.min(valueA, valueB)}% compared with ${Math.max(valueA, valueB)}% in ${higherCountry}. The data do not identify a cause.`
    return [{ metric, title: metric === 'daily_stress' ? 'Workplace stress' : metricLabels[metric], prompt, comparison }]
  })
}
