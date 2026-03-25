
from plugins.base import BaseProvider
import cloudscraper
from bs4 import BeautifulSoup
from pprint import pprint

class WeebCentral(BaseProvider):

    name = "WeebCentral"
    baseUrl = "https://weebcentral.com/"

    def __init__(self):
        self.scraper = cloudscraper.create_scraper()
        self.request_timeout = 15

    def fetch_home(self):
        #title
        #cover
        #link

        
        response = self.scraper.get(self.baseUrl, timeout=self.request_timeout)
        soup = BeautifulSoup(response.text, 'html.parser')
      
        seltitle = soup.select("a.min-w-0 > div:nth-child(1)")
        
        selcover = soup.select("a.aspect-square > picture > source")
        #print(selcover)
        sellink = soup.select("a.aspect-square")


        results = []

        for i in range(0,10):
            title = seltitle[i].get_text(" ", strip=True)
            cover = selcover[i]["srcset"].lstrip('/')
            link = sellink[i]["href"].lstrip('/')

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



        response = self.scraper.get(url, timeout=self.request_timeout)
        soup = BeautifulSoup(response.text, "html.parser")
        desc  = soup.select_one("p.whitespace-pre-wrap").get_text(strip=True) 
        author = soup.select_one("ul > li:nth-child(1) > span > a").get_text(strip=True)

        showChapters = soup.select_one("button[hx-get]")
        showChaptersUrl = showChapters.get("hx-get")
        #print(showChaptersUrl)

        element = self.scraper.get(showChaptersUrl, timeout=self.request_timeout)
        soup2 = BeautifulSoup(element.text, "html.parser")

        fullChapterList = soup2.select("span.grow > span:nth-child(1)")
        chaptersLinks = soup2.select("div > a")

    
        chapterList = [item.get_text(strip=True) for item in fullChapterList ]
        chaptersLinks = [item["href"].lstrip() for item in chaptersLinks]  

        #body > div:nth-child(1) > a > span.grow.flex.items-center.gap-2 > span:nth-child(1)
        results = []
        results.append({
                "desc": desc,
                "author": author,
                "chapters": chapterList,
                "chaptersLinks": chaptersLinks

            })

        return results
    
    def search_mango(self, name):
        #tittle
        #cover
        #link



        url = "https://weebcentral.com/search/simple"
        payload = {
            "location":"main",
            "text": name
        }
        response = self.scraper.post(url,data=payload)
        soup = BeautifulSoup(response.text, "html.parser")
        dataImg = soup.select("img")
        dataLink = soup.select("a")
        link = [item["href"].lstrip() for item in dataLink]
        title = [item["alt"].replace("cover", " ").strip() for item in dataImg]
        cover = [item["src"].lstrip() for item in dataImg]

        results = []


        for index, t in enumerate(title):
            results.append({
                "title": t,
                "cover": cover[index],
                "link": link[index]
            })

        return results
    
    def get_pages(self, manga):
        #pageList
        #chapter
        #name
        
        #pprint(manga)
        #https://weebcentral.com/chapters/01J76XZ10114J1C4Z5J83XKWV9
        mangaCode = manga.split("/")

        directUrl = f"https://weebcentral.com/chapters/{mangaCode[4]}/images?is_prev=False&current_page=1&reading_style=long_strip"


        response = self.scraper.get(directUrl, timeout=self.request_timeout)
        soup = BeautifulSoup(response.text, "html.parser")
        page = soup.select("img[src]")
        #print(page)
        pageList = [item["src"].lstrip() for item in page if item.has_attr("src")]
        #body > main > 

       

        return pageList





 
