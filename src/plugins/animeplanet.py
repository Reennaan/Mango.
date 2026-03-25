from plugins.base import BaseProvider
import cloudscraper
from bs4 import BeautifulSoup
import time
from playwright.async_api import async_playwright
from extension_manager import BrowserManager
import random
from fake_useragent import UserAgent
import asyncio
import re

class AnimePlanet(BaseProvider):

    
    name = "AnimePlanet"
    baseUrl = "https://www.anime-planet.com/manga/read-online/updated"


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
        print(url)

        soup = BeautifulSoup(response.text, 'html.parser')
      
        if "Provided by" in response.text:
            chapter = soup.find_all("h3", class_="cardName")
            #print(len(chapter))
            chapterList = [item.get_text(strip=True) for item in chapter]
        else:
            chapterList = []
        
        
     
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
        
        self.scraper.get(complete)


        ua = UserAgent()
        fakeUa = ua.random


        headers = {
            "Referer": complete, 
            "User-Agent": fakeUa,
            "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Connection": "keep-alive"
        }





        response = self.scraper.get(url, headers=headers)
        if "cf-browser-verification" in response.text:
            print("Cloudflare block detectado")
            print(response.status_code)

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
                "link": complete + link[index] +"/chapters"
            })

        
        return results

    


  

    def get_pages(self, chapter_url):

        name = chapter_url.split("/")[2]
        chapter = chapter_url.split("/")[4]

        uiUrl = f"https://www.anime-planet.com/manga/{name}/chapters/{chapter}"
        apiUrl = f"https://www.anime-planet.com/api/manga/chapter/{name}/{chapter}"

        

        self.scraper.get(uiUrl)

        r = self.scraper.get(apiUrl, headers={"Referer": uiUrl})

        data = r.json()

        #hashes = data["data"]["images"]
        #print(data)

       

        pages = []

        for url in data['data']['images']:
            pages.append(url)

        #print(pages)
        return pages
    ##chapterReader > div.ChapterReader--readerArea

    #https://cdn.anime-planet.com/images/hosted-chapters/mangaup/164/14826/6454fc54989f39fc7771db9702391d75fe5a0386.jpg
    #https://cdn.anime-planet.com/images/hosted-chapters/mangaup/164/14826/e4b066262b41771141ac1e14c9d2f0589007c5eb.jpg