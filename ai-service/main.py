
from fastapi import FastAPI

app = FastAPI(
    title="EduPilot AI Service",
    description="AI APIs for question tagging, student diagnosis, and personalized learning.",
    version="1.0.0",
)


@app.get("/")
def root():
    return {
        "message": "EduPilot AI Service is running",
        "status": "ok",
    }


@app.get("/health")
def health_check():
    return {
        "service": "edupilot-ai",
        "status": "healthy",
    }
