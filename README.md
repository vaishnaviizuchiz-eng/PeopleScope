# PeopleScope – Global Workforce Intelligence Dashboard

## Overview

PeopleScope is an HR analytics and workforce intelligence dashboard for exploring source-documented workforce indicators across countries. It brings employee experience, retention, future-of-work adoption, and labour-market context into one analytical view.

The dashboard is designed to help users compare aligned measures, inspect source definitions and methodology, and identify questions HR teams may want to investigate. Comparisons are shown only where the underlying source, definition, population, period, and method support them; missing or misaligned observations remain explicitly pending.

The current implementation focuses on India and the United States. Its 52 source-linked records cover Gallup employee experience indicators, India-specific EY attrition, Microsoft / LinkedIn knowledge-worker GenAI use, and World Bank WDI / ILO modelled labour-market measures.

## Business / HR Problem

HR teams often have workforce data but struggle to connect employee experience, retention, future-of-work adoption, and labour-market conditions. PeopleScope organizes these signals into one analytical view while preserving the context needed to interpret them responsibly.

## Key Questions

- How do employee engagement indicators differ?
- How do wellbeing and daily stress indicators differ?
- What retention and attrition information is available?
- How does workplace GenAI use compare among the covered knowledge-worker populations?
- What labour-market conditions should HR consider?
- Where is additional data required before making a comparison?

## Key Features

- Country comparison and year filtering
- Industry filtering and a workforce scorecard
- Employee engagement, wellbeing, and daily stress indicators
- India-specific attrition trend, composition, and sector analysis
- AI / Future of Work analysis with population scope shown
- Labour-market indicators with working-hours and wage-growth pending states
- Rule-based, objective HR insights and investigation prompts
- Source, definition, year, geography, industry, and methodology transparency
- Comparability-aware analysis and explicit unavailable-data states

## Data Sources

| Source group | Contribution | Source links |
|---|---|---|
| Gallup | India and United States employee engagement, Life Evaluation wellbeing, and daily stress measures for 2022–2025. | [India country data](https://www.gallup.com/workplace/705650/state-global-workplace-india-country-level-data.aspx) · [United States country data](https://www.gallup.com/workplace/704063/state-global-workplace-united-states-country-level-data.aspx) |
| EY India | India overall, voluntary, involuntary, and sector attrition observations from *Future of Pay 2026*. | [Future of Pay](https://www.ey.com/en_in/insights/workforce/how-competitive-compensation-is-reshaping-the-future-of-pay) |
| Microsoft / LinkedIn Work Trend Index | Reported workplace GenAI use among knowledge workers in India and the United States in 2024. | [India report](https://news.microsoft.com/en-in/92-of-indian-knowledge-workers-use-ai-in-the-workplace-finds-microsoft-and-linkedin-2024-work-trend-index/) · [United States report](https://assets-c4akfrf5b4d3f4b7.z01.azurefd.net/assets/2024/05/2024-Work-Trend-Index-Annual-Report-Executive-Summary_DCArea_663b81374c6d4.pdf) |
| World Bank WDI / ILO Modelled Estimates | 2025 unemployment, labour-force participation, and employment-to-population indicators for India and the United States. | [India WDI](https://data.worldbank.org/indicator/SL.UEM.TOTL.ZS?locations=IN) · [United States WDI](https://data.worldbank.org/indicator/SL.UEM.TOTL.ZS?locations=US) |

The dashboard CSV retains the source URL for each observation, including indicator-specific World Bank links. See [`data/processed/workforce_metrics_template.csv`](data/processed/workforce_metrics_template.csv) and the [data schema documentation](docs/data-schema.md) for record-level context.

## Data Quality & Comparability

Every observation retains source and context metadata, including country, year, metric, unit, definition, methodology, industry, geography, and notes. The Pandas validator checks required fields, valid years and numeric values, source metadata, and duplicate records.

Metrics are not compared merely because they share a name. A comparison requires sufficiently aligned definitions, source methods, populations, units, and periods. Unavailable or insufficiently comparable combinations are shown as “Comparable data pending”; they are not treated as zero. Observed differences describe the available data and are not causal explanations.

## HR Analytics Approach

```text
Source data
    → validation
    → comparability assessment
    → country / year / industry filtering
    → observed differences
    → HR investigation areas
```

HR investigation areas are hypotheses and questions for further inquiry, not causal conclusions or diagnoses of an organization.

## Example Insights

These examples use values already present in the validated dataset:

- For 2025, Gallup reports employee engagement of **23% for India** and **32% for the United States**. The dashboard presents the observed difference within the same Gallup measure and period.
- For 2025, Gallup reports Life Evaluation wellbeing of **17% for India** and **51% for the United States**, and daily stress of **28% for India** and **50% for the United States**. These are source-defined measures; a higher value should be interpreted according to that measure's meaning.
- EY reports **16.4% overall attrition for India in 2025**. The dashboard also shows EY's India sector values within that source; comparable U.S. attrition data is pending.
- The 2024 Work Trend Index reports workplace GenAI use among knowledge workers in India and the United States. This comparison refers to that survey population, not each country's entire workforce.
- World Bank WDI / ILO reports 2025 modelled labour-market indicators for both countries. The dashboard compares only matched indicator definitions and presents the source methodology.

## Tech Stack

- React and TypeScript
- Vite
- Recharts
- Python and Pandas
- FastAPI health-check API foundation
- CSV-based analytical data layer

## Project Structure

```text
analysis/
  validate_workforce_data.py       Pandas schema and record validation
backend/
  app/main.py                      FastAPI health-check endpoint
  requirements.txt                 Python dependencies
data/
  raw/                              Raw-input location and guidance
  processed/
    workforce_metrics_template.csv Source-linked analytical records
docs/
  data-schema.md                   Schema, data stages, and comparability rules
frontend/
  src/
    components/                    Dashboard modules and reusable UI
    utils/                          Comparison and insight calculations
  package.json                     Frontend scripts and dependencies
README.md
.gitignore
```

## Running the Project

### Frontend

From the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Vite prints the local URL in the terminal.

### Data validation

From the repository root:

```powershell
python analysis/validate_workforce_data.py
```

The validator requires Pandas, included in `backend/requirements.txt`. Install the backend dependencies with `python -m pip install -r backend/requirements.txt` if needed.

### Production build

From the repository root:

```powershell
cd frontend
npm run build
```

### Backend health check

From the repository root, install `backend/requirements.txt`, then run:

```powershell
cd backend
uvicorn app.main:app --reload
```

The health endpoint is available at `http://127.0.0.1:8000/health`.

## Limitations

- Current country coverage is limited to India and the United States; individual metrics have narrower year and population coverage.
- Attrition data is currently India-specific. Comparable U.S. attrition data is pending.
- Some metrics do not have sufficiently comparable cross-country data. Annual working-hours and wage-growth values are not included as a matched pair.
- Workforce measures depend on source definitions, populations, survey methods, and estimation methods. GenAI use refers to knowledge workers; World Bank labour-market values use ILO modelled estimates.
- The dashboard is descriptive and should not be interpreted as causal HR research or as a ranking of countries, employers, or workers.

## What This Demonstrates — HR Analytics

This project demonstrates HR metric interpretation, workforce and employee-experience analysis, source-specific attrition analysis, HR investigation framing, source evaluation, methodology awareness, and evidence-based HR thinking.

## What This Demonstrates — Data Analytics

This project demonstrates data sourcing, validation, structured analytical datasets, interactive filtering, comparative analysis, rule-based insight generation, dashboard development, data-quality and comparability handling, and analytical documentation.

## Portfolio Note

PeopleScope is a portfolio and research project created to demonstrate HR Analytics and Data Analytics capabilities. It is not an official product of Gallup, EY, Microsoft, LinkedIn, the World Bank, or the ILO, and it is not presented as being used by a real organization.
