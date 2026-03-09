from .base import BaseProvider
import cloudscraper
from bs4 import BeautifulSoup
import time


class MangaDex(BaseProvider):

    name = "AnimePlanet"
    baseUrl = "https://www.anime-planet.com/manga/read-online/"

    def __init__(self):
        self.scraper = cloudscraper.create_scraper()
        self.request_timeout = 15

        
    def fetch_home(self):
        #title
        #cover
        #link
        return ""

    def get_details(self, url):
        #desc
        #author
        #chapters
        #chaptersLinks
        raise NotImplementedError

    def search_mango(self, url):
        #tittle
        #cover
        #link


        raise NotImplementedError

    def get_pages(self, chapter_url):
        #pageList
        #chapter
        #name
        raise NotImplementedError