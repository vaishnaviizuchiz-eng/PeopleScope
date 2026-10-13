# Workforce data schema and handling

## Scope and grain

The dataset contains Gallup Employee Engagement, Employee Wellbeing (Life Evaluation), and Daily Stress records for India (`IN`) and the United States (`US`) for 2022–2025. These are three-year rolling averages ending in the stated year. It also contains India-only EY Future of Pay 2026 attrition figures: overall attrition for 2024 and 2025, voluntary and involuntary attrition for 2025, and sector attrition for 16 sectors in 2025. Microsoft and LinkedIn Work Trend Index 2024 records report workplace generative AI use for knowledge workers in India and the United States for 2024. World Bank WDI adds 2025 ILO modelled estimates for unemployment, labour force participation (ages 15+), and employment-to-population (ages 15+), for both countries. No U.S. attrition figure, comparable annual working-hours series, comparable wage-growth series, or 2026 observation is included.

The CSV grain is one row per `country + year + metric + industry + geography`. The validator flags repeated combinations of these fields. This allows source-reported sector records under a shared `sector_attrition` metric while preventing duplicate observations within a sector. `industry` and `geography` describe each observation's scope.

## CSV columns

| Column | Meaning |
|---|---|
| `country` | Country name; initially India or United States. |
| `country_code` | ISO 3166-1 alpha-2 code: `IN` or `US`. |
| `year` | Observation year; this populated initial dataset accepts 2022–2025. Add another year only when a reliable source exists and the validator scope is updated. |
| `metric` | Consistent metric label, including Gallup's `employee_engagement`, `employee_wellbeing`, and `daily_stress`; EY's `overall_attrition`, `voluntary_attrition`, `involuntary_attrition`, and `sector_attrition`; `genai_workplace_use`; and World Bank / ILO's `unemployment_rate`, `labour_force_participation`, and `employment_to_population`. |
| `value` | Numeric source-reported value. Leave blank only when the record is not yet a usable observation; the validator warns about blanks. |
| `unit` | Source-reported unit, such as percent, score, or index points. Preserve the source's unit. |
| `source_name` | Publisher or dataset name. Required for every observation. |
| `source_url` | Direct source or dataset URL. Required and must be an absolute HTTP(S) URL. |
| `definition` | The source's definition of the metric, retained verbatim or faithfully summarized with the source's terminology. |
| `methodology` | Survey, sampling, calculation, weighting, and other relevant method details. |
| `industry` | Covered industry or `All Industries` only when the source supports that scope. |
| `geography` | Geographic coverage or population represented by the observation. |
| `notes` | Caveats, transformations, coverage limits, or provenance notes. |

`data/processed/workforce_metrics_template.csv` contains 24 source-linked Gallup observations, 20 India-only source-linked EY attrition observations, 2 Microsoft/LinkedIn Work Trend Index observations, and 6 World Bank WDI / ILO modelled labour-market observations. The 2025 labour records use the same annual ILOEST indicator, definition, population scope, and methodology for India and the United States; the values are retained at the precision displayed on the World Bank country pages. They are modeled estimates, not national estimates. No annual working-hours values are included because OECD cautions against comparing annual-hours levels across countries when source and calculation methods differ, and the reviewed ILOSTAT hours series is weekly. No wage-growth values are included because currently identified country wage series rely on differing national sources and coverage; no aligned India-U.S. wage-growth pair was verified. The AI metric is defined by the shared survey question on frequency of generative AI use for work, and the reported country values refer to knowledge workers. Work Trend Index survey methods are shared for both 2024 values, enabling a within-source comparison; the U.S. had an additional 2,800-person sample across nine sub-regions/metros. These figures do not represent each country's entire workforce. EY's report labels the overall measure as “Attrition %” and reports the figures as actuals; the dataset retains those report labels/context without asserting an unreported denominator or a broader definition. Do not treat EY records as comparable to another source's turnover/attrition measure unless definitions and methodology are aligned.

## Data stages

- **Raw data**: source material as received, preserved without changing its original values or definitions. Record where it came from and when it was retrieved; do not silently overwrite it.
- **Cleaned data**: a documented transformation of raw data, for example normalized country labels or standardized column formatting. Preserve source context and record each transformation.
- **Validated data**: cleaned records that pass schema, completeness, type, allowed-scope, source, and duplicate checks. Validation does not prove the source is authoritative or that two measures are comparable.
- **Dashboard-ready data**: validated records with a metric definition and methodology suitable for the intended display, plus documented comparison eligibility. Only this stage should feed dashboard summaries or comparisons.

## Comparability rule

A shared label does not make two measures equivalent. Engagement scores from different surveys, or attrition, turnover, and separation rates, must not be treated as interchangeable. Retain each record's source, definition, year, unit, geography, industry coverage, and methodology. Before comparing countries, document why the definitions, populations, time periods, and methods are sufficiently comparable. If they are not, show them separately or mark the comparison unavailable.

## Validation

From the repository root, run:

```powershell
python analysis/validate_workforce_data.py
```

To validate another CSV:

```powershell
python analysis/validate_workforce_data.py path/to/file.csv
```

The script requires Pandas. Install the existing backend dependencies if needed with `python -m pip install -r backend/requirements.txt`. The empty template passes its schema checks and emits a warning that it contains no observations.

