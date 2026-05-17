from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from routers import health, auth, candidates, companies, interviews, jobs, matches, notifications, accessibility, resumes, webhooks, report, admin
from routers import companies_onboarding, interviews_telegram, interviews_chat

limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

app = FastAPI(
    title="Whyme API",
    description="API para matching de candidatos por perfil OCEAN",
    version="0.1.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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
app.include_router(companies_onboarding.router)
app.include_router(companies.router)
app.include_router(interviews.router)
app.include_router(interviews_telegram.router)
app.include_router(interviews_chat.router)
app.include_router(jobs.router)
app.include_router(matches.router)
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(accessibility.router)
app.include_router(resumes.router)
app.include_router(report.router)
app.include_router(webhooks.router)
app.include_router(admin.router)

# Serve uploaded files (resumes, etc.)
import os as _os
_upload_dir = _os.environ.get("UPLOAD_DIR", "/app/uploads")
_os.makedirs(_upload_dir, exist_ok=True)
_os.makedirs(_os.path.join(_upload_dir, "resumes"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=_upload_dir), name="uploads")


@app.get("/")
@limiter.exempt
async def root(request: Request):
    return {"service": "Whyme API", "version": "0.1.0", "status": "running"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
