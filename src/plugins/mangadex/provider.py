import os

import cloudscraper
import requests
from dotenv import load_dotenv

from providers.base import BaseProvider


class MangaDexProvider(BaseProvider):
    name = "MangaDex"
    baseUrl = "https://api.mangadex.org"

    def __init__(self):
        self.scraper = cloudscraper.create_scraper()
        self.request_timeout = 15
        self.access_token = ""
        self.refresh_token = ""
        load_dotenv()
        self.params = {
            "grant_type": "password",
            "username": os.getenv("MANGADEX_USER"),
            "password": os.getenv("MANGADEX_PASS"),
            "client_id": os.getenv("MANGADEX_CLIENT_ID"),
            "client_secret": os.getenv("MANGADEX_CLIENT_SECRET"),
        }

    def auth(self):
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        r = requests.post(
            "https://auth.mangadex.org/realms/mangadex/protocol/openid-connect/token",
            headers=headers,
            data=self.params,
            timeout=15,
        )

        self.access_token = r.json()["access_token"]
        self.refresh_token = r.json()["refresh_token"]

        self.fetch_home()

    def fetch_home(self):
        headers = {"Authorization": f"Bearer {self.access_token}"}
        params = {"limit": 1}

        r = requests.get(
            f"{self.baseUrl}/manga/?includes[]=author&includes[]=artist&includes[]=cover_art",
            headers=headers,
            timeout=15,
            params=params,
        )
        data = r.json()
        mangaList = data.get("data", [])

        results = []

        for manga in mangaList:
            manga_id = manga["id"]
            attrs = manga["attributes"]
            cover_art = next(item for item in manga["relationships"] if item["type"] == "cover_art")
            file_name = cover_art["attributes"]["fileName"]
            author = next(item for item in manga["relationships"] if item["type"] == "author")
            author_name = author["attributes"].get("name")
            description = attrs["description"].get("en") or attrs["description"].get("ja")

            title = attrs["title"].get("ja-ro") or attrs["title"].get("en") or attrs["title"].get("pt-br")

            results.append(
                {
                    "id": manga_id,
                    "title": title,
                    "cover": f"https://uploads.mangadex.org/covers/{manga_id}/{file_name}",
                    "link": f"{self.baseUrl}/manga/{manga_id}/feed",
                    "data": {
                        "author": author_name,
                        "desc": description,
                    },
                }
            )

        return results

    def get_details(self, url):
        raise NotImplementedError

    def search_mango(self, url):
        raise NotImplementedError

    def get_pages(self, chapter_url):
        raise NotImplementedError

