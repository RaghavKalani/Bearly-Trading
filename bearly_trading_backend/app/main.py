from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.routes import users, trading, portfolio, leaderboard, learning, watchlist, health
from starlette.middleware.base import BaseHTTPMiddleware
import time
import uuid
import logging
import sys

# Configure structured logging format
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "message": %(message)s}',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("bearly_trading")

app = FastAPI(
    title="Bearly Trading",
    description="A virtual stock market simulation platform",
    version="1.0.0"
)

# CORS Policy
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://bearly-trading.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Rate Limiting Middleware (In-memory, Zero-Dependency)
RATE_LIMIT_RULES = {
    "/users/login": (10, 60),      # Max 10 requests per minute
    "/users/register": (5, 60),    # Max 5 registrations per minute
    "/users/google-login": (15, 60)
}

class RateLimitingMiddleware(BaseHTTPMiddleware):
    def __init__(self, app_instance):
        super().__init__(app_instance)
        self.history = {} # {ip: {path: [timestamps]}}

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if path in RATE_LIMIT_RULES:
            limit, window = RATE_LIMIT_RULES[path]
            client_ip = request.client.host if request.client else "unknown"
            
            # Bypass rate limiter during test suites execution
            import os
            if client_ip == "testclient" or os.getenv("TESTING") == "True":
                return await call_next(request)
                
            now = time.time()

            if client_ip not in self.history:
                self.history[client_ip] = {}
            if path not in self.history[client_ip]:
                self.history[client_ip][path] = []

            # Clean expired timestamps
            self.history[client_ip][path] = [
                ts for ts in self.history[client_ip][path] if now - ts < window
            ]

            if len(self.history[client_ip][path]) >= limit:
                logger.warning(f'"Rate limit exceeded for client {client_ip} on {path}"')
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Please slow down and try again later."}
                )

            self.history[client_ip][path].append(now)

        return await call_next(request)

app.add_middleware(RateLimitingMiddleware)


# 2. Request Tracing & Structured Logging Middleware
class TracingLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Inject or extract request ID
        request_id = request.headers.get("X-Request-ID", uuid.uuid4().hex)
        request.state.request_id = request_id

        # Pre-execution log
        logger.info(f'{{"event": "request_start", "request_id": "{request_id}", "method": "{request.method}", "path": "{request.url.path}"}}')

        try:
            response = await call_next(request)
            duration = time.time() - start_time
            
            # Post-execution log
            logger.info(f'{{"event": "request_end", "request_id": "{request_id}", "method": "{request.method}", "path": "{request.url.path}", "status": {response.status_code}, "duration_sec": {duration:.4f}}}')
            
            # Inject request ID into response headers
            response.headers["X-Request-ID"] = request_id
            return response
        except Exception as e:
            duration = time.time() - start_time
            import traceback
            tb = traceback.format_exc().replace("\n", "\\n").replace('"', '\\"')
            logger.error(f'{{"event": "request_fail", "request_id": "{request_id}", "method": "{request.method}", "path": "{request.url.path}", "error": "{str(e)}", "traceback": "{tb}", "duration_sec": {duration:.4f}}}')
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error. Please contact support.", "request_id": request_id}
            )

app.add_middleware(TracingLoggingMiddleware)


# Routes Registration
app.include_router(users.router)
app.include_router(trading.router)
app.include_router(portfolio.router)
app.include_router(leaderboard.router)
app.include_router(learning.router)
app.include_router(watchlist.router)
app.include_router(health.router)

@app.get("/")
async def root():
    return {"message": "A virtual stock market simulation platform is online"}
