import sys
import os
sys.path.append(os.getcwd())
from app.config import settings
print(settings.DATABASE_URL)
