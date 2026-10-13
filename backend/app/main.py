"""FastAPI application entry point for PeopleScope."""

from fastapi import FastAPI

app = FastAPI(
    title="PeopleScope API",
    description="API foundation for the PeopleScope workforce intelligence dashboard.",
    version="0.1.0",
)


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    """Return a minimal service health status."""
    return {"status": "ok"}
