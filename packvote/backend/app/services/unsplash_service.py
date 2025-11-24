import httpx
from typing import Optional
from ..config import settings

class UnsplashService:
    def __init__(self):
        self.access_key = settings.UNSPLASH_ACCESS_KEY
        self.base_url = "https://api.unsplash.com"

    async def get_photo_url(self, query: str) -> Optional[str]:
        if not self.access_key:
            print("Warning: UNSPLASH_ACCESS_KEY not found")
            return None

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/search/photos",
                    params={
                        "query": query,
                        "per_page": 1,
                        "orientation": "landscape"
                    },
                    headers={
                        "Authorization": f"Client-ID {self.access_key}"
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data["results"]:
                        # Return the regular sized image URL
                        return data["results"][0]["urls"]["regular"]
                
                return None
        except Exception as e:
            print(f"Error fetching image from Unsplash: {e}")
            return None

unsplash_service = UnsplashService()
