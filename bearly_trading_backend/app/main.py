from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import users, trading, portfolio, leaderboard, learning

app = FastAPI(
    title="Bearly Trading",
    description="A virtual stock market simulation platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local development (React/Next.js)
        "http://localhost:5173",  # Local development (Vite)
        "https://bearly-trading.vercel.app",  # Production frontend
        "https://bearly-trading-git-main-raghavkalanis-projects.vercel.app",  # Vercel Git branch
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",  # Vercel preview deployments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "A virtual stock market simulation platform"}

app.include_router(users.router)
app.include_router(trading.router)
app.include_router(portfolio.router)
app.include_router(leaderboard.router)
app.include_router(learning.router)
