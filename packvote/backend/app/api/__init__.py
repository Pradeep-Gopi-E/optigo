from .auth import router as auth_router
from .trips import router as trips_router
from .preferences import router as preferences_router
from .votes import router as votes_router
from .recommendations import router as recommendations_router
from .telegram import router as telegram_router
from .join_trip_endpoint import router as join_trip_router

__all__ = ["auth_router", "trips_router", "preferences_router", "votes_router", "recommendations_router", "telegram_router", "join_trip_router"]