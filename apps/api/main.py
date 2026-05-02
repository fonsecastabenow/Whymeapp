from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import health, auth, candidates, companies, interviews, jobs, matches, notifications

app = FastAPI(
    title="Whyme API",
    description="API para matching de candidatos por perfil OCEAN",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(auth.router)
app.include_router(candidates.router)
app.include_router(companies.router)
app.include_router(interviews.router)
app.include_router(jobs.router)
app.include_router(matches.router)
app.include_router(notifications.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"service": "Whyme API", "version": "0.1.0", "status": "running"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
