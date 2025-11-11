from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import sys

from .config import settings
from .utils.database import engine, Base
from .api import auth_router, trips_router, votes_router, recommendations_router, telegram_router, preferences_router

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('app.log')
    ]
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-assisted group trip planner with ranked-choice voting",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS middleware
origins = settings.ALLOWED_ORIGINS.split(",") if settings.ALLOWED_ORIGINS else ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "message": "An unexpected error occurred"}
    )


# Include routers
app.include_router(auth_router, prefix="/api")
app.include_router(trips_router, prefix="/api")
app.include_router(preferences_router, prefix="/api")
app.include_router(votes_router, prefix="/api")
app.include_router(recommendations_router, prefix="/api")
app.include_router(telegram_router, prefix="/api")


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": "development" if settings.DEBUG else "production"
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "version": settings.APP_VERSION,
        "docs_url": "/docs" if settings.DEBUG else None
    }


# Create database tables
# Create database tables
@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    try:
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables recreated successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {str(e)}")


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event"""
    logger.info("Application shutting down")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )