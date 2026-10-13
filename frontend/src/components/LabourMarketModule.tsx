import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  compareLabourMetric,
  labourMetricLabels,
  labourMetricOrder,
  type LabourMarketRecord,
} from '../utils/labourMarketInsights'

const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })
const colors = { India: '#3c6fa5', 'United States': '#8795a8' }

export function LabourMarketModule({ records, selectedYear, industry }: { records: LabourMarketRecord[]; selectedYear: number; industry: string }) {
  const scopedRecords = industry === 'All Industries' ? records : []
  const comparisons = labourMetricOrder.map((metric) => compareLabourMetric(scopedRecords, metric, selectedYear)).filter((comparison) => comparison !== null)
  const chartData = comparisons.map((comparison) => ({
    label: labourMetricLabels[comparison.metric],
    India: comparison.india.value,
    'United States': comparison.unitedStates.value,
  }))
  const availableYears = [...new Set(records.map((record) => record.year))].sort((a, b) => a - b)

  return <section id="labour-market" className="dashboard-section" aria-labelledby="labour-heading">
    <div className="section-heading"><div><span className="section-eyebrow">MACROECONOMIC WORKFORCE CONTEXT</span><h2 id="labour-heading">Labour Market &amp; Compensation</h2><p>Comparable World Bank / ILO modelled indicators currently available for {availableYears.join(', ') || 'no years'}.</p></div></div>

    {industry !== 'All Industries' && <div className="filter-context-note">Data not available for this selection. These World Bank / ILO records cover All Industries.</div>}
    <div className="labour-snapshot-heading"><div><h3>Labour Market Snapshot</h3><p>India and United States · selected year {selectedYear}</p></div><span className="attrition-tag">{comparisons.length} comparable indicators</span></div>
    {chartData.length > 0 ? <div className="labour-chart-panel"><div className="labour-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, bottom: 0, left: 4 }}><CartesianGrid stroke="#edf1f5" strokeDasharray="3 3" horizontal={false} /><XAxis type="number" domain={[0, 100]} tickFormatter={(value: number) => `${value}%`} tickLine={false} axisLine={{ stroke: '#e5eaf0' }} tick={{ fill: '#8794a4', fontSize: 9 }} /><YAxis type="category" dataKey="label" width={180} tickLine={false} axisLine={false} tick={{ fill: '#687990', fontSize: 9 }} /><Tooltip formatter={(value) => [`${value}%`, '']} /><Legend verticalAlign="top" height={25} iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 9, color: '#687990' }} /><Bar dataKey="India" fill={colors.India} radius={[0, 3, 3, 0]} barSize={11} /><Bar dataKey="United States" fill={colors['United States']} radius={[0, 3, 3, 0]} barSize={11} /></BarChart></ResponsiveContainer></div><p className="labour-chart-note">Each country pair uses the same indicator definition and 2025 modeled series. Percentages have different denominators across indicators; compare within each indicator only.</p></div> : <div className="labour-pending-banner">Comparable data pending for {selectedYear}. Verified paired observations are available for {availableYears.join(', ') || 'no years'}.</div>}

    <div className="labour-metric-grid">{labourMetricOrder.map((metric) => {
      const comparison = compareLabourMetric(scopedRecords, metric, selectedYear)
      const sourceIndia = records.find((record) => record.metric === metric && record.country === 'India')
      const sourceUs = records.find((record) => record.metric === metric && record.country === 'United States')
      const detail = comparison?.india ?? sourceIndia ?? sourceUs
      return <article className="labour-metric-card" key={metric}><div className="attrition-card-heading"><div><h3>{labourMetricLabels[metric]}</h3><p>{comparison ? `Year ${comparison.year}` : `Comparable data pending for ${selectedYear}`}</p></div><span className="attrition-tag">{comparison ? 'Comparable' : 'Pending'}</span></div>
        {comparison ? <><div className="labour-values"><div><span>India</span><strong>{numberFormat.format(comparison.india.value)}%</strong></div><div><span>United States</span><strong>{numberFormat.format(comparison.unitedStates.value)}%</strong></div><div><span>Difference</span><strong>{numberFormat.format(comparison.difference)} pp</strong></div></div><div className="labour-source-links"><a href={comparison.india.source_url} target="_blank" rel="noreferrer">India source ↗</a><a href={comparison.unitedStates.source_url} target="_blank" rel="noreferrer">United States source ↗</a></div></> : <div className="labour-pending-inline">No matched observations are available for this selected year.</div>}
        {detail && <div className="labour-definition"><b>Definition</b><p>{detail.definition}</p><b>Methodology</b><p>{detail.methodology}</p><small>Source: {detail.source_name} · Geography: India and United States · Industry: All Industries</small></div>}
      </article>
    })}</div>

    <div className="labour-breakdown-grid">
      <article className="labour-status-card"><div className="attrition-card-heading"><div><h3>Working Hours</h3><p>Annual working-hours comparison</p></div><span className="attrition-tag">Comparable data pending</span></div><p>Annual hours are not added. The OECD cautions that annual-hours levels are unsuitable for cross-country comparison because data sources and calculation methods differ. ILO’s reviewed hours series is weekly, so it is not converted into annual hours here.</p><a href="https://www.oecd.org/en/data/indicators/hours-worked.html" target="_blank" rel="noreferrer">OECD hours-worked methodology ↗</a><a href="https://ilostat.ilo.org/data/" target="_blank" rel="noreferrer">ILOSTAT data catalogue ↗</a></article>
      <article className="labour-status-card"><div className="attrition-card-heading"><div><h3>Wage Growth</h3><p>Comparable wage-growth series</p></div><span className="attrition-tag">Comparable data pending</span></div><p>No matching India–U.S. wage-growth pair is added. ILO country wage estimates draw on different national sources and coverage; the Global Wage Report documents country-specific definitions and focuses on change within countries.</p><a href="https://www.ilo.org/resource/other/global-wage-report-series" target="_blank" rel="noreferrer">ILO Global Wage Report series and methodology ↗</a></article>
    </div>

    <div className="labour-context-panel"><div className="attrition-card-heading"><div><h3>HR Context</h3><p>Macro indicators inform questions; they do not establish causes.</p></div></div><div className="labour-prompts"><p>Labour-market conditions can influence hiring availability and workforce planning.</p><p>Changes in wage growth may be relevant when reviewing compensation competitiveness.</p><p>Working-hours differences may provide context for workforce planning and employee experience.</p></div></div>

    <div className="labour-method-warning"><strong>Methodology &amp; transparency</strong><p>For the three displayed labour-market metrics, source values are annual 2025 World Bank WDI series based on the ILO Modelled Estimates database (ILOEST). The paired values share the same source series, year, definition, and population scope for each metric. Values are retained at the precision shown on the World Bank pages.</p><p>Macro labour-market indicators provide context for HR decisions but do not explain employee-level outcomes on their own.</p></div>

    <details className="attrition-provenance labour-provenance"><summary>View source records and methodology for all labour-market values ({records.length})</summary><div className="attrition-table-wrap"><table><thead><tr><th>Country</th><th>Year</th><th>Metric</th><th>Value / unit</th><th>Definition</th><th>Methodology</th><th>Geography</th><th>Industry</th><th>Source</th></tr></thead><tbody>{records.map((record) => <tr key={`${record.country}-${record.metric}`}><td>{record.country}</td><td>{record.year}</td><td>{labourMetricLabels[record.metric as keyof typeof labourMetricLabels]}</td><td>{record.value} {record.unit}</td><td>{record.definition}</td><td>{record.methodology}</td><td>{record.geography}</td><td>{record.industry}</td><td><a href={record.source_url} target="_blank" rel="noreferrer">{record.source_name} ↗</a></td></tr>)}</tbody></table></div></details>
  </section>
}
