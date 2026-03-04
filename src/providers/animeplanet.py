from .base import BaseProvider
import cloudscraper
from bs4 import BeautifulSoup

class AnimePlanet(BaseProvider):

    
    name = "AnimePlanet"
    baseUrl = "https://www.anime-planet.com/manga/read-online/"
