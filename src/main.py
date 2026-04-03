import cloudscraper
import webview
from bs4 import BeautifulSoup
from plugins.base import BaseProvider
from pprint import pprint
import json
from pathlib import Path
import os
import re
import time
import sys
import img2pdf
from ebooklib import epub
import logging
import random
from fake_useragent import UserAgent
from webview2_runtime import ensure_webview2_runtime
from extension_manager import (
    load_all_providers,
    fetch_available_extensions,
    get_installed_extensions,
    install_extension,
    uninstall_extension,
)

scraper = cloudscraper.create_scraper()

downloadFormat = "Download options"


IS_BUNDLED = "__compiled__" in globals() or getattr(sys, "frozen", False)

if "__compiled__" in globals():
    # Nuitka: o .exe fica dentro de mango2.dist/
    APP_BASE = Path(sys.executable).resolve().parent
    RESOURCE_BASE = APP_BASE
elif getattr(sys, "frozen", False):
    APP_BASE = Path(sys.executable).resolve().parent
    RESOURCE_BASE = Path(getattr(sys, "_MEIPASS", APP_BASE))
else:
    APP_BASE = Path(__file__).resolve().parent 
    RESOURCE_BASE = Path(__file__).resolve().parent.parent  



currentFolder = str(APP_BASE / "downloads")

logging.basicConfig(
    filename='app.log',
    filemode='a',       
    format='%(asctime)s - %(levelname)s - %(message)s',
    level=logging.DEBUG
)

recents = []
fav = []


class Api:
    def __init__(self):
        self.pending_download = None
        self.currentFolder = currentFolder
        self.downloadFormat = downloadFormat
        self.recents = recents
        self.fav = fav
        self._scraper = cloudscraper.create_scraper()  
        self._settings_file = APP_BASE / ".settings.json"
        self.providers ={
            p.name: p for p in load_all_providers()
        }
        frist = next(iter(self.providers.values()),None)
        self.currentProvider = frist

        
        self._load_settings()



    def _load_settings(self):
        if not self._settings_file.exists():
            return
        try: 
            data = json.loads(self._settings_file.read_text(encoding="utf-8"))
            saved_folder = data.get("currentFolder")
            if isinstance(saved_folder, str) and saved_folder.strip():
                self.currentFolder = saved_folder
            saved_format = data.get("downloadFormat")
            if isinstance(saved_format, str) and saved_format.strip():
                self.downloadFormat = saved_format
                print(f"current format: {self.downloadFormat}")
                logging.info(f"current format: {self.downloadFormat}")
            saved_recents = data.get("recents")
            if isinstance(saved_recents, list) and len(saved_recents) > 0:
                print("aparentemente salvou os recents")                
                self.recents = saved_recents

            fav = data.get("fav")
            if isinstance(fav, list) and len(fav) > 0:
                print("fav salvo")                
                self.fav = fav

        except Exception as e:
            print(f"failed to load settings: {e}")
            logging.error(f"failed to load settings: {e}")
            window.evaluate_js(f"showToast('ailed to load settings: {e}')")

    def _save_settings(self):
        try:
            data = {
            "currentFolder": self.currentFolder,
            "downloadFormat": self.downloadFormat,
            "recents": self.recents,
            "fav":self.fav
            }
            
          
            self._settings_file.write_text(
                json.dumps(data, ensure_ascii=False, indent=2),
                encoding="utf-8"
            )



        except Exception as e:
            print(f"failed to save settings: {e}")
            logging.error(f"failed to save settings: {e}")
            window.evaluate_js(f"showToast('failed to save settings: {e}')")

    


    def changeProvider(self, name):
        print(f"changeProvider chamado com: '{name}'")
        print(f"providers disponíveis: {list(self.providers.keys())}")
        logging.info(f"changeProvider chamado com: '{name}'")
        logging.info(f"providers disponíveis: {list(self.providers.keys())}")
        
        if name in self.providers:
            self.currentProvider = self.providers[name]
            print(f"trocado para: {self.currentProvider}") 
            return
        
        for key, provider in self.providers.items():
            if key.lower() == name.lower() or getattr(provider, 'id', '').lower() == name.lower():
                self.currentProvider = provider
                print(f"trocado para (fallback): {self.currentProvider}")
                return
        print(f"[changeProvider] provider '{name}' não encontrado. Disponíveis: {list(self.providers.keys())}")
        logging.info(f"[changeProvider] provider '{name}' não encontrado. Disponíveis: {list(self.providers.keys())}")

    def changeFormat(self,name):
        self.downloadFormat = name

    def getFormat(self):
        return self.downloadFormat 

    def getRecents(self):
        return self.recents
    
    def getFav(self):
        return self.fav


    def genericFetch(self):
        pprint(self.currentProvider)
        if self.currentProvider == "Select the source":
            with open('.settings.json','r',encoding="utf-8") as f:
                manga = json.load(f)
                for mangas in manga:
                    jsCall = f"window.buildMangaInfo({json.dumps(manga)})"
                    window.evaluate_js(jsCall)
        else:
            mangas = self.currentProvider.fetch_home()
            for i in range(0,10):
                jsCall = f"window.buildMangaInfo({json.dumps(mangas[i])})"
                window.evaluate_js(jsCall)

    def search_mango(self,name):
        mangas = self.currentProvider.search_mango(name)


        #print(len(mangas))

        #print(mangas)
        window.evaluate_js("document.getElementById('library-container').innerHTML = '';")
        window.evaluate_js("changeShowText('Results:');")


        for manga in mangas:
            jsCall = f"window.buildMangaInfo({manga})"  
            
            window.evaluate_js(jsCall)

        #window.evaluate_js("showToast('aqui')")
        


    def genericGetDetails(self, manga):
         
        pprint(manga)
     
        try:
            if self.currentProvider.__class__.__name__ == "MangaDex":
                details = self.currentProvider.get_details(manga)
            else:
                details = self.currentProvider.get_details(manga.get("link"))
        except Exception as e:
            print(f"[genericGetDetails] error: {e}")
          
            return False
        
        mangas = details
        #pprint(mangas)
        
        self.pending_download = {
            "chapters": mangas[0]["chapters"] if mangas else mangas.get("chapters", []),
            "img": manga.get("cover"),
            "title": manga.get("title"),
            "author": mangas[0]["author"] if mangas else mangas.get("author", ""),
            "chaptersLinks": mangas[0]["chaptersLinks"] if mangas else  mangas.get("chaptersLinks", []),
            "desc": mangas[0]["desc"] if mangas else mangas.get("desc",[])

        }
        #print(self.pending_download)
        return True
    

    def genericDownload(self, manga, chapterIndex):
        
        pprint(manga["chaptersLinks"])

        pageList = self.currentProvider.get_pages(manga["chaptersLinks"])
        ua = UserAgent()
        fakeUa = ua.random


        if self.currentProvider.__class__.__name__ == "AnimePlanet":
            referer = "https://www.anime-planet.com/"
            session_cookies = scraper.cookies.get_dict()
        
            # esta linha monta o cookie do dominio anterior (anime-planet) para cnd (cnd.anime-planet) pois é necessário aplicar o cookie manualmente
            cookie_header = "; ".join([f"{k}={v}" for k, v in session_cookies.items()])
            # o scraper conseguia esse cookie no domínio principal, mas não o enviava ao CDN por serem subdomínios diferentes.

            headers = {
                "Referer": referer,
                "User-Agent": fakeUa,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
                "sec-ch-ua": '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"Windows"',
                "sec-fetch-dest": "document",
                "sec-fetch-mode": "navigate",
                "sec-fetch-site": "none",
                "sec-fetch-user": "?1",
                "upgrade-insecure-requests": "1",
                "Cookie": cookie_header,  # aqui eu injetei cf_clearance no cdn
            }
            
        else:
            referer = manga["chaptersLinks"]
            headers = {
                "Referer": referer, 
                "User-Agent": fakeUa,
                "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Connection": "keep-alive"
            }

        #local_scraper = cloudscraper.create_scraper()

        filterChar = r'[<>:"/\\|?*]'
        filteredName = re.sub(filterChar, "_", manga["title"])
        filteredChapter = re.sub(filterChar, "_", str(manga["chapters"]))


        basePath = self.currentFolder
        folderName = f"{filteredName}"
        fullPath = os.path.join(basePath,folderName,filteredChapter)

        os.makedirs(fullPath, exist_ok=True)

        if self.downloadFormat == "PDF":
            self.downloadPDF(headers,folderName,fullPath,pageList)
        elif self.downloadFormat == "EPUB":
            self.downloadEPUB(headers,folderName,fullPath,pageList)
        else:
            for i, item in enumerate(pageList):
                print(f"baixando pagina {i}")
                images = self._scraper.get(item, headers=headers)
                filePath = os.path.join(fullPath,f"{i+1}.jpg")
                time.sleep(1)
                with open(filePath, "wb") as f:
                    f.write(images.content)
                
            return ""
    


    def downloadPDF(self, headers,folderName, fullPath, pageList):
        local_scraper = cloudscraper.create_scraper()
        imageBytes = []

        for i, item in enumerate(pageList):
            print(f"baixando pagina {i} PDF")
            images = local_scraper.get(item, headers=headers)
            time.sleep(1)
            imageBytes.append(images.content)

        with open(os.path.join(fullPath,f"{folderName}.pdf"), "wb") as f:
            f.write(img2pdf.convert(*imageBytes))
            time.sleep(random.uniform(1.5,3))

        return "baixei em pdf"



    def downloadEPUB(self, headers, folderName, fullPath, pageList):
        local_scraper = cloudscraper.create_scraper()

        book = epub.EpubBook()
        book.set_identifier(folderName)
        book.set_title(folderName)
        book.set_language("pt-BR")
        chapter = epub.EpubHtml(title=folderName, file_name="chapter.xhtml", lang="pt-BR")
        chapterContent = [f"<h1>{folderName}</h1>"]

        for i, item in enumerate(pageList):
            print(f"baixando pagina {i} EPUB")
            images = local_scraper.get(item, headers=headers)
            imgName = f"image_{i+1}.jpg"
            img = epub.EpubItem(
                uid=f"img_{i+1}",
                file_name=imgName,
                media_type="image/jpeg",
                content=images.content
            )
            book.add_item(img)
            chapterContent.append(f'<p><img src="{imgName}" alt="page {i+1}" /></p>')
            time.sleep(random.uniform(1.5,3))

        chapter.content = "".join(chapterContent)
        book.add_item(chapter)
        book.toc = (epub.Link("chapter.xhtml", folderName, "chapter"),)
        book.add_item(epub.EpubNcx())
        book.add_item(epub.EpubNav())
        book.spine = ["nav", chapter]

        epub.write_epub(os.path.join(fullPath, f"{folderName}.epub"), book, {})

        return "baixei em EPUB"    


    def getPendingDownloadData(self):
        return self.pending_download
        
    
 

    def selectFolder(self):
        
        folder = window.create_file_dialog(webview.FileDialog.FOLDER)
        if folder:
            self.currentFolder = folder[0] if isinstance(folder, (list, tuple)) else folder
            self._save_settings()
            print(f"current folder: {self.currentFolder}")
            return self.currentFolder
        return None     
    




    def backgroundManga(self,name):
        query = """
        query ($search: String) {
        Page(page: 1, perPage: 1) {
            media(search: $search, type: MANGA) {
            title {
                romaji
            }
            coverImage {
                extraLarge
            }
            bannerImage
            }
        }
        }
        """

        response = self._scraper.post(
            "https://graphql.anilist.co",
            json={
                "query": query,
                "variables": {"search": name}
            }
        )

        data = response.json()

        media = data["data"]["Page"]["media"]

        if not media:
            return None

        cover = media[0]["coverImage"]["extraLarge"]
        banner = media[0]["bannerImage"]

        return cover



    def get_extensions_page_data(self):
        available  = fetch_available_extensions()
        installed  = get_installed_extensions()
        for ext in available:
            ext["is_installed"] = ext["id"] in installed
        return json.dumps({"available": available, "installed": installed})



    def install_extension(self, ext_json):
        ext = json.loads(ext_json)
        ok, msg = install_extension(ext)
        if ok:
            p = load_all_providers()
            self.providers = {x.name: x for x in p}
        return json.dumps({"ok": ok, "message": msg})





    def uninstall_extension(self, ext_id):
        ok, msg = uninstall_extension(ext_id)
        if ok:
            self.providers.pop(
                next((k for k,v in self.providers.items()
                      if getattr(v,"id",None)==ext_id), None), None)
        return json.dumps({"ok": ok, "message": msg})




    def saveRecentCache(self,manga):

        if not self._settings_file.exists():
           data = {
               "currentFolder": "",
               "downloadFormat": "",
               "recents": "",
               "fav":""
           }
           self._settings_file.write_text(
                   json.dumps(data,ensure_ascii=False, indent=2),
                   encoding="utf-8"
               )


        if any(item["link"] == manga["link"] for item in self.recents):
            return
        
        ext = fetch_available_extensions()
        icon = ""
        for item in ext:
            if item["name"] == manga["currentSource"]:
                icon = item["icon"]

        manga["icon"] = icon
        recent = manga
        self.recents.append(recent)

        if len(self.recents) > 10:
            self.recents.pop(0)
       
                
        self._save_settings()
       
        
    def saveFav(self, data):

        if hasattr(data, 'get') and not isinstance(data, dict):
        # Equivalente ao data.getAttribute('data-manga')
            raw_data = data.get('data-manga')
            manga = json.loads(raw_data) # Equivalente ao JSON.parse
        else:
            manga = data


        if any(item["link"] == manga["link"] for item in self.fav):
            #safe_title = manga['title'].replace("'", "\\'")
            #window.evaluate_js(f"showToast('{safe_title} its already in your favorites')")
            return

        ext = fetch_available_extensions()
        icon = ""
        for item in ext:
            if item["name"] == manga["currentSource"]:
                icon = item["icon"]

        manga["icon"] = icon
        fav = manga
        self.fav.append(fav)

        if len(self.fav) > 30:
            self.fav.pop(0)
       
                
        self._save_settings()





api = Api()



# --- DETECÇÃO DE AMBIENTE ---
if getattr(sys, 'frozen', False):
    # No Executável: sys._MEIPASS aponta SEMPRE para onde os dados estão
    # (seja na raiz do temporário no --onefile ou no _internal no --onedir)
    RESOURCE_BASE = Path(sys._MEIPASS)
    APP_BASE = Path(sys.executable).parent
else:
    # No VS Code: subimos um nível para achar 'assets' a partir de 'src/main.py'
    APP_BASE = Path(__file__).resolve().parent
    RESOURCE_BASE = APP_BASE.parent

# --- DEFINIÇÃO DOS ARQUIVOS ---
index_file = RESOURCE_BASE / "assets" / "index.html"
icon_file = RESOURCE_BASE / "img" / "icon.ico"

print(f"RESOURCE_BASE: {RESOURCE_BASE}")
print(f"index_file: {index_file}")
print(f"index existe: {index_file.exists()}")
logging.info(f"RESOURCE_BASE: {RESOURCE_BASE}")
logging.info(f"index_file: {index_file}")
logging.info(f"index existe: {index_file.exists()}")
ensure_webview2_runtime()
window = webview.create_window("Mango", url=str(index_file), js_api=api, width=1280 ,height=720)



config = {
    "http_server": True,
    "icon": str(icon_file),
    "gui": "edgechromium",
    "debug":True
}

try:
    webview.start(**config)
except Exception as exc:
    logging.exception("Falha ao iniciar a interface com WebView2: %s", exc)
    raise
