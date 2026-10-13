"""Validate the PeopleScope workforce metric CSV contract."""

from __future__ import annotations

import argparse
from pathlib import Path
import sys
from urllib.parse import urlparse

import pandas as pd

REQUIRED_COLUMNS = [
    "country",
    "country_code",
    "year",
    "metric",
    "value",
    "unit",
    "source_name",
    "source_url",
    "definition",
    "methodology",
    "industry",
    "geography",
    "notes",
]
ALLOWED_COUNTRIES = {"India": "IN", "United States": "US"}
ALLOWED_YEARS = {2022, 2023, 2024, 2025}
# Industry is part of the grain so sector-level observations can coexist.
DUPLICATE_KEY = ["country", "year", "metric", "industry", "geography"]
ALLOWED_METRICS = {
    "employee_engagement",
    "employee_wellbeing",
    "daily_stress",
    "overall_attrition",
    "voluntary_attrition",
    "involuntary_attrition",
    "sector_attrition",
    "genai_workplace_use",
    "unemployment_rate",
    "labour_force_participation",
    "employment_to_population",
}
ATTRITION_METRICS = {"overall_attrition", "voluntary_attrition", "involuntary_attrition", "sector_attrition"}
AI_METRICS = {"genai_workplace_use"}
LABOUR_METRICS = {"unemployment_rate", "labour_force_participation", "employment_to_population"}
EY_SOURCE_URL = "https://www.ey.com/en_in/insights/workforce/how-competitive-compensation-is-reshaping-the-future-of-pay"


def validate_csv(path: Path) -> tuple[list[str], list[str], int]:
    """Return errors, warnings, and the number of data records."""
    errors: list[str] = []
    warnings: list[str] = []

    try:
        frame = pd.read_csv(path, dtype={"country_code": "string"})
    except FileNotFoundError:
        return [f"CSV file not found: {path}"], warnings, 0
    except pd.errors.EmptyDataError:
        return ["CSV is empty and has no header row."], warnings, 0
    except Exception as exc:  # Surface parse/encoding issues as a concise validation error.
        return [f"Could not read CSV: {exc}"], warnings, 0

    missing_columns = [column for column in REQUIRED_COLUMNS if column not in frame.columns]
    if missing_columns:
        errors.append(f"Missing required columns: {', '.join(missing_columns)}")
        return errors, warnings, len(frame)

    if frame.empty:
        warnings.append("No data records found; the schema-only template is valid but no observations were checked.")
        return errors, warnings, 0

    text_columns = ["country", "country_code", "metric", "source_name", "source_url"]
    for column in text_columns:
        blank = frame[column].isna() | frame[column].astype("string").str.strip().eq("")
        if blank.any():
            errors.append(f"{column} is empty in {int(blank.sum())} record(s).")

    valid_year = pd.to_numeric(frame["year"], errors="coerce")
    invalid_year = valid_year.isna() | ~valid_year.isin(ALLOWED_YEARS)
    if invalid_year.any():
        errors.append(
            "year must be a whole year in the available 2022–2025 range; "
            f"invalid record(s): {frame.index[invalid_year].tolist()}"
        )

    unknown_countries = frame["country"].astype("string").str.strip().map(ALLOWED_COUNTRIES).isna()
    if unknown_countries.any():
        errors.append(
            "country must be India or United States for this initial dataset; "
            f"invalid record(s): {frame.index[unknown_countries].tolist()}"
        )

    unknown_metrics = ~frame["metric"].astype("string").str.strip().isin(ALLOWED_METRICS)
    if unknown_metrics.any():
        errors.append(f"metric contains unsupported value(s): {frame.loc[unknown_metrics, 'metric'].tolist()}")

    expected_codes = frame["country"].astype("string").str.strip().map(ALLOWED_COUNTRIES)
    code_mismatch = expected_codes.notna() & frame["country_code"].astype("string").str.strip().ne(expected_codes)
    if code_mismatch.any():
        errors.append(f"country_code does not match country in {int(code_mismatch.sum())} record(s).")

    values = frame["value"].astype("string").str.strip()
    supplied_values = values.notna() & values.ne("")
    numeric_values = pd.to_numeric(values.where(supplied_values), errors="coerce")
    nonnumeric_values = supplied_values & numeric_values.isna()
    if nonnumeric_values.any():
        errors.append(f"value must be numeric when supplied; invalid record(s): {frame.index[nonnumeric_values].tolist()}")
    missing_values = ~supplied_values
    if missing_values.any():
        warnings.append(f"value is blank in {int(missing_values.sum())} record(s); these are not usable observations.")

    percent_rows = frame["unit"].astype("string").str.strip().str.casefold().eq("percent") & numeric_values.notna()
    out_of_range = percent_rows & ~numeric_values.between(0, 100)
    if out_of_range.any():
        errors.append(f"percent values must be between 0 and 100; invalid record(s): {frame.index[out_of_range].tolist()}")

    attrition_rows = frame["metric"].astype("string").isin(ATTRITION_METRICS)
    if attrition_rows.any():
        attrition = frame.loc[attrition_rows]
        if attrition["country"].astype("string").str.strip().ne("India").any():
            errors.append("EY attrition observations in this release must be India-only.")
        if attrition["source_name"].astype("string").str.strip().ne("EY India").any():
            errors.append("Attrition observations must retain source_name 'EY India'.")
        if attrition["source_url"].astype("string").str.strip().ne(EY_SOURCE_URL).any():
            errors.append("Attrition observations must use the supplied official EY source URL.")
        overall_types = {"overall_attrition", "voluntary_attrition", "involuntary_attrition"}
        overall_rows = attrition["metric"].astype("string").isin(overall_types)
        if attrition.loc[overall_rows, "industry"].astype("string").str.strip().ne("All Industries").any():
            errors.append("Overall, voluntary, and involuntary attrition records must use industry 'All Industries'.")
        if attrition.loc[~overall_rows, "industry"].astype("string").str.strip().eq("All Industries").any():
            errors.append("Sector attrition records must identify the reported sector in industry.")
        for column in ["definition", "methodology", "geography"]:
            empty = attrition[column].isna() | attrition[column].astype("string").str.strip().eq("")
            if empty.any():
                errors.append(f"EY attrition records require {column}; missing in {int(empty.sum())} record(s).")

    ai_rows = frame["metric"].astype("string").isin(AI_METRICS)
    if ai_rows.any():
        ai = frame.loc[ai_rows]
        if ai["source_name"].astype("string").str.strip().ne("Microsoft and LinkedIn Work Trend Index 2024").any():
            errors.append("Workplace GenAI records must retain source_name 'Microsoft and LinkedIn Work Trend Index 2024'.")
        if ai["year"].astype("string").str.strip().ne("2024").any():
            errors.append("Current Work Trend Index GenAI records must use report year 2024.")
        if ai["unit"].astype("string").str.strip().str.casefold().ne("percent").any():
            errors.append("Work Trend Index GenAI use records must use unit 'percent'.")
        if ai["industry"].astype("string").str.strip().ne("All Industries").any():
            errors.append("Work Trend Index GenAI use records must use industry 'All Industries'.")
        for column in ["definition", "methodology", "geography"]:
            empty = ai[column].isna() | ai[column].astype("string").str.strip().eq("")
            if empty.any():
                errors.append(f"Work Trend Index GenAI records require {column}; missing in {int(empty.sum())} record(s).")
        ai_countries = set(ai["country"].astype("string").str.strip())
        if ai_countries != {"India", "United States"}:
            errors.append("Work Trend Index comparison currently requires one India and one United States record.")
        if ai["definition"].nunique(dropna=False) != 1 or ai["methodology"].nunique(dropna=False) != 1:
            errors.append("Work Trend Index comparison records must share the same definition and methodology.")

    labour_rows = frame["metric"].astype("string").isin(LABOUR_METRICS)
    if labour_rows.any():
        labour = frame.loc[labour_rows]
        if labour["source_name"].astype("string").str.strip().ne("World Bank WDI (ILO Modelled Estimates)").any():
            errors.append("Labour-market indicator records must retain source_name 'World Bank WDI (ILO Modelled Estimates)'.")
        if labour["unit"].astype("string").str.strip().str.casefold().ne("percent").any():
            errors.append("Current labour-market indicators must use unit 'percent'.")
        if labour["industry"].astype("string").str.strip().ne("All Industries").any():
            errors.append("Current labour-market indicators must use industry 'All Industries'.")
        for column in ["definition", "methodology", "geography"]:
            empty = labour[column].isna() | labour[column].astype("string").str.strip().eq("")
            if empty.any():
                errors.append(f"Labour-market records require {column}; missing in {int(empty.sum())} record(s).")
        for metric, metric_rows in labour.groupby("metric"):
            if set(metric_rows["country"].astype("string").str.strip()) != {"India", "United States"}:
                errors.append(f"Comparable labour-market metric {metric} requires India and United States records.")
            if metric_rows["year"].nunique(dropna=False) != 1:
                errors.append(f"Comparable labour-market metric {metric} must use the same year for both countries.")
            if metric_rows["definition"].nunique(dropna=False) != 1 or metric_rows["methodology"].nunique(dropna=False) != 1:
                errors.append(f"Comparable labour-market metric {metric} must share a definition and methodology.")

    for index, value in frame["source_url"].items():
        if pd.isna(value) or not str(value).strip():
            continue
        parsed = urlparse(str(value).strip())
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            errors.append(f"source_url must be an absolute http(s) URL (record {index}).")

    duplicate = frame.duplicated(subset=DUPLICATE_KEY, keep=False)
    if duplicate.any():
        duplicate_rows = frame.loc[duplicate, DUPLICATE_KEY].to_dict(orient="records")
        errors.append(f"Duplicate country/year/metric/industry/geography records detected: {duplicate_rows}")

    return errors, warnings, len(frame)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "csv_path",
        nargs="?",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "data" / "processed" / "workforce_metrics_template.csv",
        help="CSV file to validate (defaults to the processed template).",
    )
    args = parser.parse_args()

    errors, warnings, record_count = validate_csv(args.csv_path)
    print(f"Validated {args.csv_path} ({record_count} record(s)).")
    for warning in warnings:
        print(f"WARNING: {warning}")
    for error in errors:
        print(f"ERROR: {error}")
    if errors:
        print("Validation failed.")
        return 1
    print("Validation passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

