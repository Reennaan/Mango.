from .base import BaseProvider
import cloudscraper
from bs4 import BeautifulSoup
import time

class AnimePlanet(BaseProvider):

    
    name = "AnimePlanet"
    baseUrl = "https://www.anime-planet.com/manga/read-online/"


    def __init__(self):
        self.scraper = cloudscraper.create_scraper()
        self.request_timeout = 15


    def fetch_home(self):
        #title
        #cover
        #link
        response = self.scraper.get(self.baseUrl)
        url = "https://www.anime-planet.com/"

        soup = BeautifulSoup(response.text, 'html.parser')
       
        selCover = soup.select("ul > li.card > a.tooltip > div.crop > img")
        selLink = soup.select("ul > li.card > a.tooltip")
        


        results = []

        for i in range(0, 10):
            cover = selCover[i]["data-src"]
            link = url + selLink[i]["href"].lstrip('/')
            title = selCover[i]["alt"]

            results.append({
                "title": title,
                "cover": cover,
                "link": link

            })

        
        return results




        
    def get_details(self, url):
        #desc
        #author
        #chapters
        #chaptersLinks

        response = self.scraper.get(url)

        soup = BeautifulSoup(response.text, 'html.parser')
        chapter = soup.find_all("h3", class_="cardName")
        
      

        chapterList = [item.get_text(strip=True) for item in chapter]
        hrefs = soup.select("ul > li.card > a")
        chaptersLinks = [item.get("href") for item in hrefs]
        parts = chaptersLinks[0].split("/")[2]
        overviewUrl = f"https://www.anime-planet.com/manga/{parts}"
        #print(overviewUrl)
        

        response = self.scraper.get(overviewUrl)
        soup = BeautifulSoup(response.text, 'html.parser')
        element = soup.select_one("div.synopsisManga > p")
        desc = element.get_text(" ", strip=True) if element else ""
        





      
        results = []
        results.append({
                "desc": desc,
                "author": "",
                "chapters": chapterList,
                "chaptersLinks": chaptersLinks

            })

        return results



        
    def search_mango(self, name):
        #tittle
        #cover
        #link
        url = f"https://www.anime-planet.com/manga/all?name={name}"
        complete = "https://www.anime-planet.com"
        response = self.scraper.get(url)
        soup = BeautifulSoup(response.text , "html.parser")
        dataTitle = soup.select("h3.cardName")
        dataCover = soup.select(".crop > img")
        dataLink = soup.select("ul > li.card > a")
        

        title = [item.get_text(strip=True) for item in dataTitle]
        cover = [item["data-src"] for item in dataCover]
        link = [item["href"] for item in dataLink]
        
       
        results = []


        for index, t in enumerate(title):
            results.append({
                "title": t,
                "cover": cover[index],
                "link": complete + link[index]
            })

        



        return results

    


    
    def get_pages(self, chapter_url):
        #pageList
        #chapter
        #name
        name = chapter_url.split("/")[2]
        chapter = chapter_url.split("/")[4]

        uiUrl = f"https://www.anime-planet.com/manga/{name}/chapters/{chapter}"
        self.scraper = cloudscraper.create_scraper(browser={'browser': 'chrome', 'platform': 'windows', 'desktop': True})

        self.scraper.get(uiUrl)
        
        fullUrl = f"https://www.anime-planet.com/api/manga/chapter/{name}/{chapter}"

        response = self.scraper.get(fullUrl,headers={"Referer":uiUrl})
        dados = response.json()
        pageList = dados["data"]["images"]

        return pageList