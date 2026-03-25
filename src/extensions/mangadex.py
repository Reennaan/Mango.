from plugins.base import BaseProvider
import os
import cloudscraper
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
import requests
from dotenv import load_dotenv
from pprint import pprint

class MangaDex(BaseProvider):

    name = "MangaDex"
    baseUrl = "https://api.mangadex.org"
    

    def __init__(self):
        self.scraper = cloudscraper.create_scraper()
        self.request_timeout = 15
        self.access_token = ""
        self.refresh_token = ""
        load_dotenv()
        self.params = {
            'grant_type':'password',
            'username': os.getenv('MANGADEX_USER'),
            'password': os.getenv('MANGADEX_PASS'),
            'client_id': os.getenv('MANGADEX_CLIENT_ID'),
            'client_secret': os.getenv('MANGADEX_CLIENT_SECRET')
            
            }
        
    def auth(self):
        #rint(os.getenv('MANGADEX_CLIENT_ID'))

       
        headers = {'Content-Type': 'application/x-www-form-urlencoded'}
        r = requests.post("https://auth.mangadex.org/realms/mangadex/protocol/openid-connect/token",headers=headers, data=self.params , timeout=15)

        r.raise_for_status() 

        self.access_token = r.json()['access_token']
        self.refresh_token = r.json()['refresh_token']
        #print(self.access_token)

        self.fetch_home()

        


    def fetch_home(self,name=None):
        #title
        #cover
        #link
        #print(name)
        
        headers = {'Authorization': f'Bearer {self.access_token}'}
        params = {
            'limit': 10,
            'includes[]': ['author', 'artist', 'cover_art'] 
        }
        

        if name:
            params = {
                'title': name,
                'limit': 10,
                'includes[]': ['author', 'artist', 'cover_art'],
                #"translatedLanguage[]": ["en"] 
            }
        

        r = requests.get(f"{self.baseUrl}/manga",headers=headers, timeout=15 , params=params)
        print(f"url: {r.request.url}")
        #print(f"params: {r.request.params}")
        data = r.json()
       
        mangaList = data.get('data', [])
        results = []
        #pprint(mangaList)

        for manga in mangaList:
            manga_id = manga["id"]
            #print(manga)
            attrs = manga['attributes']
            cover_art = next(item for item in manga["relationships"] if item["type"] == "cover_art")
            
            file_name = cover_art["attributes"]["fileName"]
            author = next(item for item in manga["relationships"] if item["type"] == "author")
            author_name = author["attributes"].get("name")
            description = attrs["description"].get("en") or attrs["description"].get("ja")
            title = attrs['title'].get('ja-ro') or attrs['title'].get('en') or attrs['title'].get('pt-br') or attrs['title'].get('zh-ro')
            if not title:
                alts = attrs.get('altTitles', [])
                title = next((alt.get('en') or alt.get('ja-ro') or alt.get('zh-ro') 
                for alt in alts if any(k in alt for k in ['en', 'ja-ro', 'zh-ro'])), None)

                    
                if not title and alts:
                    title = list(alts[0].values())[0]
                        


            

            
            
            

            #file_name = manga['relationships']['attributes'].get('fileName')
            #file_name = next(item for item in manga["relationships"] if item["type"] == "")
            #url to find images
            #https://uploads.mangadex.org/covers/8f3e1818-a015-491d-bd81-3addc4d7d56a/26dd2770-d383-42e9-a42b-32765a4d99c8.png
            

            results.append({
                "id": manga_id,
                "title": title,
                "cover": f"https://uploads.mangadex.org/covers/{manga_id}/{file_name}.512.jpg",
                "link": f"{self.baseUrl}/manga/{manga_id}/feed?translatedLanguage[]=en",
                "data": {
                    "author": author_name ,
                    "desc": description,
                    #"chapters": chapters_data
                }
            })

        #print(results)


        return results

    


        

    def get_details(self, manga):
        #desc
        #author
        #chapters
        #chaptersLinks
        #print(json.dumps(manga))

        rc = requests.get(manga.get("link"))
        chapters = rc.json().get("data", [])
        #print(chapters)
        chapter = []
        chaptersLinks = []
        result = []
        for item in chapters:
            chapterid = item["id"]
            chapter.append(f"Chapter {item['attributes'].get('chapter')}")
            chaptersLinks.append(f"https://api.mangadex.org/at-home/server/{chapterid}")

            '''
            chapters_data = [
                {
                    "chapter": c["attributes"]["chapter"],
                    "title": c["attributes"]["title"],
                    "link": f"https://api.mangadex.org/chapter/{c['id']}"
                }
                for c in chapters
                if c["attributes"]["translatedLanguage"] == "en"
            ]
            '''


        result = {
            "desc": manga["data"].get("desc"),
            "author" : manga["data"].get("author_name"),
            "chapters" : chapter,
            "chaptersLinks" : chaptersLinks
        }
        
        #pprint(result)
        return [result]



       

    def search_mango(self, name):
        #tittle
        #cover
        #link
        


        return self.fetch_home(name)

    def get_pages(self, chapter_url):
        #pageList
        #chapter
        #name
        #pprint(chapter_url)


        r =  requests.get(chapter_url).json()
        chapterHash = r["chapter"].get("hash")
        chapterData = r["chapter"].get("data")
        dataUrl = r["baseUrl"]
        pages = []
        for item in chapterData:
            pages.append(f"{dataUrl}/data/{chapterHash}/{item}")

        pprint(pages)

        #    https://cmdxd98sb0x3yprd.mangadex.network/data/25f8494c4b02ee11f919140f19b63e46/1-fa9ad56d985723c112e70363b5b02f7a93ba880b573a440eee59388dd791bdf3.png
        return pages