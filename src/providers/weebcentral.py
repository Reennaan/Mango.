from .base import BaseProvider
import cloudscraper
from bs4 import BeautifulSoup

class WeebCentral(BaseProvider):

    name = "WeebCentral"
    baseUrl = "https://weebcentral.com/"

    def __init__(self):
        self.scraper = cloudscraper.create_scraper()

    def fetch_home(self):
        #title
        #cover
        #link
        response = self.scraper.get(self.baseUrl)
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



        response = self.scraper.get(url)
        soup = BeautifulSoup(response.text, "html.parser")
        desc  = soup.select_one("p.whitespace-pre-wrap").get_text(strip=True) 
        author = soup.select_one("ul > li:nth-child(1) > span > a").get_text(strip=True)

        showChapters = soup.select_one("button[hx-get]")
        showChaptersUrl = showChapters.get("hx-get")
        print(showChaptersUrl)

        element = self.scraper.get(showChaptersUrl)
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
    
    def get_chapters(self, url):
        return super().get_chapters(url)
    
    def get_pages(self, chapter_url):
        return super().get_pages(chapter_url)


 