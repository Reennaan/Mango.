window.buildMangaInfo = buildMangaInfo;
window.showToast = showToast;
window.initSources = initSources;
window.addEventListener('pywebviewready', initSources);


let toastHideTimeout = null;
let currentProviderName = "";



window.addEventListener('pywebviewready', () => {
    initSources();
    loadRecents();
});

async function initSources(){
    const sourceDropdown = document.querySelector(".dropdown-sources");
    if (!sourceDropdown) return;
    try {
        const raw = await window.pywebview.api.get_extensions_page_data();
        const { installed } = JSON.parse(raw);
        const names = Object.values(installed);
       sourceDropdown.innerHTML = names.length
        ? names.map(e => `<div class="dropdown-item" data-value="${e.name}" data-id="${e.id}">${e.name}</div>`).join('')
        : '<div class="dropdown-item" style="opacity:.4">no extensions installed</div>';
    } catch(e) {
        console.error("initSources:", e);
    }
}

async function loadRecents() {
    const container = document.getElementById('library-container');
    if (!container) return;

    try {
        const recents = await window.pywebview.api.getRecents();
        container.innerHTML = "";
        changeShowText("Recents");

        if (!Array.isArray(recents)) return;

        recents.slice().reverse().forEach((manga) => {
            buildMangaInfo(manga);
        });
    } catch (e) {
        console.error("loadRecents:", e);
    }
}



function ensureToastElement() {
    let toast = document.getElementById('app-toast');
    if (toast) return toast;

    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'app-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);

    return toast;
}

function showToast(message) {
    const toast = ensureToastElement();
    const safeMessage = typeof message === 'string' ? message.trim() : String(message ?? '').trim();

    if (!safeMessage) return;

    toast.textContent = safeMessage;
    toast.classList.remove('is-visible');
    void toast.offsetWidth;
    toast.classList.add('is-visible');

    if (toastHideTimeout) {
        clearTimeout(toastHideTimeout);
    }

    toastHideTimeout = setTimeout(() => {
        toast.classList.remove('is-visible');
    }, 2800);
}

function getExtensionButtonMarkup() {
    return `
        <button type="button" class="extensions-trigger" aria-label="Open extensions">
            <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 0 1-.657.643 48.39 48.39 0 0 1-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 0 1-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 0 0-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 0 1-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 0 0 .657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 0 0 5.427-.63 48.05 48.05 0 0 0 .582-4.717.532.532 0 0 0-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 0 0 .658-.663 48.422 48.422 0 0 0-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 0 1-.61-.58v0Z" />
            </svg>
        </button>
    `;
}

function getDefaultDetailMarkup(message = "Select a manga to view details") {
    return `${getExtensionButtonMarkup()}<div class="empty-state"><p>${message}</p></div>`;
}

function clearDetailView(message = "Select a manga to view details") {
    const detailView = document.getElementById("detail-view");
    if (!detailView) return;

    detailView.innerHTML = getDefaultDetailMarkup(message);
}

function closeExtensionPage() {
    const container = document.querySelector(".extensionContainer");
    if (!container) return;

    container.classList.remove("is-visible");
    container.innerHTML = "";
}

const defaultInstallButton = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`
const uninstallButton = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"  width="16" height="16"><g id="SVGRepo_bgCarrier" stroke-width="2"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M18 6V16.2C18 17.8802 18 18.7202 17.673 19.362C17.3854 19.9265 16.9265 20.3854 16.362 20.673C15.7202 21 14.8802 21 13.2 21H10.8C9.11984 21 8.27976 21 7.63803 20.673C7.07354 20.3854 6.6146 19.9265 6.32698 19.362C6 18.7202 6 17.8802 6 16.2V6M14 10V17M10 10V17" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>`

function renderExtensionCards(extensions) {
    if (!extensions || !extensions.length)
        return '<p style="color:var(--color-text-secondary);padding:24px">No extensions found</p>';

    return extensions.map((ext) => `
        <article class="extension-card">
            <div class="extension-card-main">
                <img 
                    src="${ext.icon || ''}" 
                    alt="${ext.name}" 
                    class="extension-icon"
                    onerror="this.style.display='none'"
                >
                <div class="extension-copy">
                    <div class="extension-name-row">
                        <h3>${ext.name}</h3>
                        ${ext.is_installed ? '<span class="extension-installed-badge badge">INSTALLED</span>' : ''}
                        <span class="language badge">${ext.language ? ext.language.toUpperCase()  : 'Extension'}</span>
                        ${ext.nsfw ? '<span class="extension-author badge nsfw">+18</span>' : ''}
                    </div>
                    
                    ${ext.description ? `<p class="extension-desc">${ext.description}</p>` : ''}
                </div>
            </div>
            <button type="button" class="extension-action"
                data-ext='${JSON.stringify(ext).replace(/'/g, "&#39;")}'
                data-installed="${ext.is_installed}">
                ${ext.is_installed ? uninstallButton : defaultInstallButton}
            </button>
        </article>
    `).join("");
}

function syncExtensionCardState(providerButton, installed) {
    const extensionCard = providerButton.closest(".extension-card");
    const extensionNameRow = extensionCard?.querySelector(".extension-name-row");
    if (!extensionNameRow) return;

    const existingBadge = extensionNameRow.querySelector(".extension-installed-badge");

    if (installed) {
        if (!existingBadge) {
            const badge = document.createElement("span");
            badge.className = "extension-installed-badge badge";
            badge.textContent = "INSTALED";
            extensionNameRow.appendChild(badge);
        }
    } else if (existingBadge) {
        existingBadge.remove();
    }

    providerButton.dataset.installed = String(installed);
    providerButton.innerHTML = installed ? uninstallButton : defaultInstallButton;
}



const spinner = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 24 24'%3E%3C!-- Icon from SVG Spinners by Utkarsh Verma - https://github.com/n3r4zzurr0/svg-spinners/blob/main/LICENSE --%3E%3Cpath fill='%23fff' stroke='%23fff' d='M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z'%3E%3CanimateTransform attributeName='transform' dur='0.75s' repeatCount='indefinite' type='rotate' values='0 12 12;360 12 12'/%3E%3C/path%3E%3C/svg%3E";


document.addEventListener("click", async function(event) {
    const extensionTrigger = event.target.closest(".extensions-trigger");
    if (extensionTrigger) {
        event.preventDefault();
        renderExtension();
        return;
    }

    const closeButton = event.target.closest(".extensions-close");
    if (closeButton) {
        event.preventDefault();
        closeExtensionPage();
        return;
    }

    const sourcesTrigger = event.target.closest(".dropdown-sources");
    if(sourcesTrigger) {
        event.preventDefault();
       
        
    }

    const providerButton = event.target.closest(".extension-action[data-ext]");
    if (!providerButton || providerButton.disabled) return;

    const ext = JSON.parse(providerButton.dataset.ext);
    const isInstalled = providerButton.dataset.installed === "true";
    providerButton.disabled = true;
    providerButton.innerHTML = `<img src="${spinner}" alt="downloading"  style="width:14px;height:14px;display:block;">`;



    try {
        let raw;
        if (isInstalled) {
            raw = await window.pywebview.api.uninstall_extension(ext.id);
        } else {
            raw = await window.pywebview.api.install_extension(JSON.stringify(ext));
        }
        const res = JSON.parse(raw);
        showToast(res.message);
        if (res.ok) {
            syncExtensionCardState(providerButton, !isInstalled);
            initSources();
        } else {
            providerButton.innerHTML = isInstalled ? uninstallButton : defaultInstallButton;
        }
    } catch(e) {
        showToast("Erro inesperado.");
        providerButton.textContent = isInstalled ? uninstallButton : defaultInstallButton;
    } finally {
        providerButton.disabled = false;
    }


    if (!providerButton || providerButton.disabled) return;

    
  
    
});






document.addEventListener("click", (e)=>{
    if(!e.target.closest(".dropdown")){
        
    }
})



async function renderExtension() {
    const container = document.querySelector(".extensionContainer");
    if (!container) return;

    // mostra loading imediatamente
    container.innerHTML = extensionShell('<p style="color:var(--color-text-secondary);padding:24px">Carregando...</p>');
    container.classList.add("is-visible");

    try {
        const raw = await window.pywebview.api.get_extensions_page_data();
        const data = JSON.parse(raw);
        container.querySelector(".extension-grid").innerHTML = renderExtensionCards(data.available);
    } catch(e) {
        container.querySelector(".extension-grid").innerHTML =
            '<p style="color:var(--color-text-danger);padding:24px">Fail on load extensions</p>';
    }
}

function extensionShell(gridContent) {
    return `
        <div class="extension-page custom-scrollbar">
            <div class="extension-shell">
                <div class="extension-header">
                    <div><h1 class="extension-title">Extensions</h1>
                    <p class="extension-subtitle">Manage and install new manga sources.</p></div>
                    <button type="button" class="extensions-close" aria-label="Close extensions">✕</button>
                </div>
                <div class="extension-grid">${gridContent}</div>
            </div>
        </div>`;
}






const header = document.getElementById("dropdown-header")
const list = document.getElementById("dropdown-list")

header.addEventListener("click", function () {

    if(list.style.display === "block"){
        list.style.display = "none"
    }else{
        list.style.display = "block"
    }

})

function changeShowText(text){
    document.querySelector(".popular-recents").innerHTML = text
}


async function setActiveProvider(source, fetchHome = true) {
    if (!source) return;

    currentProviderName = source;
    header.textContent = source;
    list.style.display = "none";

    changeShowText(`Popular on: ${source}`);
    document.getElementById("library-container").innerHTML = "";
    clearDetailView();

    await window.pywebview.api.changeProvider(source);
    if (fetchHome) {
        window.pywebview.api.genericFetch();
    }
}

list.addEventListener("click", function(e){
    const item = e.target
    if(!item.classList.contains("dropdown-item")) return
    const source = item.dataset.value

    if(source !== "Select the source"){
        setActiveProvider(source)
    }

})


function toggleDropdown(){
    const list = document.getElementById("dropdown-list");

    if(list.style.display === "block"){
        list.style.display = "none";
    }else{
        list.style.display = "block";
    }
}

async function initDownloadOptionsDropdown(root) {
    const dropdown = root.querySelector('.download-dropdown');
    if (!dropdown) return;




    

    const header = dropdown.querySelector('.download-dropdown-header');
    const list = dropdown.querySelector('.download-dropdown-list');
    if (!header || !list) return;

    header.addEventListener('click', function () {
        list.style.display = list.style.display === 'block' ? 'none' : 'block';
    });

    const currentDownloadFormat = await window.pywebview.api.getFormat();
    if(currentDownloadFormat && currentDownloadFormat != "Download options"){
        window.pywebview.api.changeFormat(currentDownloadFormat);
        header.textContent = currentDownloadFormat;
        list.style.display = 'none';

    }else{
        header.textContent = "Download options"
    } 
        
    
    list.addEventListener('click', function (e) {
        const item = e.target.closest('.dropdown-item');
        if (!item) return;

        const selectedFormat = item.dataset.format;
        if (!selectedFormat) return;

        header.textContent = selectedFormat;
        list.style.display = 'none';
        window.pywebview.api.changeFormat(selectedFormat);
    });

}

document.addEventListener("click", (e)=>{
    if(!e.target.closest(".dropdown")){
        document.querySelectorAll(".dropdown-list").forEach((dropdownList) => {
            dropdownList.style.display = "none";
        });
    }
})



document.addEventListener('click', async function (event) {
    const folderButton = event.target.closest('.folder-button');
    if (!folderButton) return;

    //console.log("foi");
    try {
        const selected = await window.pywebview.api.selectFolder();
        //console.log(selected);
    } catch (error) {
        console.error('erro ao selecionar pasta:', error);
        showToast('erro ao selecionar pasta:', error)
    }
});

document.addEventListener('click', async function (event) {
    const bookmarkButton = event.target.closest('.bookmark');
    if (!bookmarkButton) return;

    const titleEl = document.querySelector(".manga-title-large");
    const title = titleEl ? titleEl.textContent : "";  // evita o erro

    try {
        bookmarkButton.classList.toggle("fill");
        bookmarkButton.innerHTML = bookmarkButton.classList.contains("fill")
            ? bookmarkFilledSvg
            : bookmarkOutlineSvg;
        
        if (title) showToast(`${title} addeded to favorites`);
    } catch (error) {
        console.error('Fail to add as favorite:', error);
        showToast('Fail to add as favorite:', error);
    }
});



const svgAsc = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:all;cursor:pointer"><path d="M13 12H21M13 8H21M13 16H21M6 7V17M6 7L3 10M6 7L9 10"></path></svg>`;

const svgDesc = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:all;cursor:pointer"><path d="M13 12H21M13 8H21M13 16H21M6 7V17M6 17L3 14M6 17L9 14"></path></svg>`;

document.addEventListener('click', async function (event) {
    const alignButton = event.target.closest('.align-button');
    if (!alignButton) return;

    const container = document.querySelector(".chapters-grid");
    if (!container) return;

    const items = Array.from(container.querySelectorAll(".chapter-item"));
    if (!items.length) return;

    const isAsc = alignButton.dataset.order !== 'asc';
    alignButton.dataset.order = isAsc ? 'asc' : 'desc';
    alignButton.innerHTML = isAsc ? svgAsc : svgDesc;

    items.sort((a, b) => {
        const numA = parseFloat(a.querySelector(".chapter-name")?.textContent.replace(/[^0-9.]/g, '') ?? 0);
        const numB = parseFloat(b.querySelector(".chapter-name")?.textContent.replace(/[^0-9.]/g, '') ?? 0);
        return isAsc ? numA - numB : numB - numA;
    });

    items.forEach(item => container.appendChild(item));
});


document.addEventListener('click', async function(event){
    const searchBtn = event.target.closest(".search-icon");
    if (!searchBtn) return;

    const inputValue = document.querySelector(".search-input").value
    console.log(inputValue)
    if(inputValue != ""){
        const searchedMango = await window.pywebview.api.search_mango(inputValue);
    }
})


document.addEventListener("keydown", async function(event) {
    if (event.key === "Escape") {
        closeExtensionPage();
    }
    
    if(event.key !== "Enter") return;
        
    const inputValue = document.querySelector(".search-input").value
    console.log(inputValue)
    if(inputValue != ""){
        const searchedMango = await window.pywebview.api.search_mango(inputValue);
    }


});




async function buildMangaInfo(manga) {
    

    const container = document.getElementById('library-container');
    if (!container) return;
    try{
        const cover = manga.cover
        const title = manga.title
        const link = manga.link
        console.log(cover, title,link)

        const card = document.createElement('div');
        card.className = 'mangaCard';
        card.innerHTML = `
            <img src="${cover}" class="cardImg" alt="${title}" referrerPolicy="no-referrer">
            <h3 class="titleCard">${title}</h3>
        `;

        card.onclick = async () => {
            if (manga.currentSource) {
                await setActiveProvider(manga.currentSource, false);
            }
            
            document.querySelectorAll('.mangaCard').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
        
            renderMangaDetails(manga);
        };

        container.appendChild(card);
    }catch (error){
        console.error("erro ao baixar capitulo:", error);
        showToast("failed to download chapter:", error)
    }
   
}

const chapterDefaultIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" x2="12" y1="15" y2="3"/>
</svg>
`;

const chapterLoadingIconDataUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 24 24'%3E%3C!-- Icon from SVG Spinners by Utkarsh Verma - https://github.com/n3r4zzurr0/svg-spinners/blob/main/LICENSE --%3E%3Cpath fill='%23fff' stroke='%23fff' d='M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z'%3E%3CanimateTransform attributeName='transform' dur='0.75s' repeatCount='indefinite' type='rotate' values='0 12 12;360 12 12'/%3E%3C/path%3E%3C/svg%3E";
const bookmarkOutlineSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 21-1.45-1.32C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.18z"></path></svg>`;
const bookmarkFilledSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="m12 21-1.45-1.32C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.18z"></path></svg>`;

function setChapterDownloadIcon(chapterIndex, isLoading) {
    const iconContainer = document.querySelector(`.chapter-item[data-chapter-index="${chapterIndex}"] .chapter-download-icon`);
    if (!iconContainer) return;

    if (isLoading) {
        iconContainer.innerHTML = `<img src="${chapterLoadingIconDataUrl}" alt="downloading"  style="width:14px;height:14px;display:block;">`;
        return;
    }

    iconContainer.innerHTML = chapterDefaultIconSvg;
}

window.mangaDownloadPage = async function( ch, chaptersLinks , title,  chapterIndex) {
    //if (!downloadLink || Array.isArray(downloadLink)) return "";
    //console.log(downloadLink, chapters, title)
    // chapters, downloadLink , title
    //const urlStr = downloadLink.toString();
    //const parts = urlStr.split("/");

    //let slug = parts.slice(2).join("/").split("/")[0];
    //let chapter = parts[4];
   

    manga = {
        "chapters": ch,
        "chaptersLinks": chaptersLinks,
        "title": title,
        
    }

    setChapterDownloadIcon(chapterIndex, true);
    try {
        //console.log(downloadLink, chapters, title)

    
        await window.pywebview.api.genericDownload(manga, chapterIndex);
        

        
        //await window.pywebview.api.downloadFile(slug, chapter);
    } catch (error) {
        console.error("erro ao baixar capitulo:", error);
        showToast("failed to download chapter:", error)
    } finally {
        setChapterDownloadIcon(chapterIndex, false);
        showToast(`${manga.title} ${ch} is avaliable now`)
    }

    return "";
}



async function renderMangaDetails(manga) {
    const detailView = document.getElementById('detail-view');
    if (!detailView) return;
    //vem como title, cover, link

    //console.log(manga.link)

    const extensionMarkup = getExtensionButtonMarkup();

    
   





   
    detailView.innerHTML = `${extensionMarkup}<div class="empty-state"><p>Loading chapters...</p></div>`;

    let chaptersData = null;
    try {
        
        const withTimeout = (promise, timeoutMs, message) => Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error(message)), timeoutMs))
        ]);

        await withTimeout(
            //title, cover, link ainda
            
            window.pywebview.api.genericGetDetails(manga),
            15000,
            "Timeout while loading chapters."
        );

        //desc
        //author
        //chapters
        //chaptersLinks
        chaptersData = await withTimeout(
            window.pywebview.api.getPendingDownloadData(),
            5000,
            "Timeout while reading chapters data."
        );
        

        backgroundImg = await window.pywebview.api.backgroundManga(manga.title)
        if (typeof backgroundImg !== 'string')
            backgroundImg = ""
    
    } catch (e) {
        detailView.innerHTML = `${extensionMarkup}<div class="empty-state"><p>error when searching for chapters</p></div>`;
        console.error("erro ao buscar capítulos:", e);
        showToast("failure when searching for chapters", e)
    }

    if (!chaptersData) {
        detailView.innerHTML = `${extensionMarkup}<div class="empty-state"><p>Failed to load chapters.</p></div>`;
        return;
    }

    const {
        chapters = [],
        img = "",
        title = "",
        chaptersLinks = [],
        desc = "",
        author = ""
    } = chaptersData || {};
    if(author === "null" || author === "not avaliable"){
        authorText = " "
    }else{
        authorText = author
    }
        
    
        
    const descText = Array.isArray(desc) ? desc.join(" ") : (desc || "Description not available.");
    const descClass = descText.length > 550 ? "manga-desc custom-scrollbar has-scroll" : "manga-desc";
    const titleText = typeof title === "string" && title.length > 45 ? `${title.slice(0, 45)}...` : title;

    saveRecent(manga, currentProviderName)


    detailView.innerHTML = `
        ${extensionMarkup}
        ${backgroundImg ? `
            <div class="backgorund-manga">
                    <img class="manga-img" src ="${backgroundImg}">
            </div>
            
            `: ''}
          

        <div class="detail-bg">
            <img src="${img}" alt="" referrerPolicy="no-referrer" onerror="this.style.display='none';">
            <div class="detail-gradient"></div>
        </div>

        <div class="detail-content custom-scrollbar">
            <div class="manga-header">
                <div class="manga-cover-large">
                    <img src="${img}" alt="${title}" referrerPolicy="no-referrer">
                </div>
                <div class="manga-info">
                        
                    <h1 class="manga-title-large">${titleText}</h1>
                    ${authorText ? ` 
                         <div class="text-4xl font-bold mb-8 text-white/80 author-name">${authorText}</div>
                        
                        `: ''}
                   
                    <p class="${descClass}">
                        ${descText}
                    </p>
                </div>
              
            </div>

            <div class="chapters-section">
                <div class="section-header">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <h3 class="chapters-title-page">Chapters</h3>
                        <div style="display: flex; gap: 0.5rem; color: rgba(255,255,255,0.2);">
                            <div class="bookmark" onclick="saveFavorite(${manga, currentProviderName})" >
                                ${bookmarkOutlineSvg}
                            </div>

                            <div class="align-button">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: all; cursor: pointer; ><g id="SVGRepo_bgCarrier"  ></g><g id="SVGRepo_tracerCarrier" ></g><g id="SVGRepo_iconCarrier"> <path d="M13 12H21M13 8H21M13 16H21M6 7V17M6 17L3 14M6 17L9 14" ></path> </g></svg>
                            </div>
                            <div class="folder-button">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-folder" style="pointer-events: all; cursor: pointer;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                            </div>
                        </div>
                    </div>
                    <div class="dropdown download-dropdown download-options">
                        <div class="dropdown-header download-dropdown-header">
                            Download options
                        </div>
                        <div class="dropdown-list download-dropdown-list">
                            <div class="dropdown-item" data-format="PDF">PDF</div>
                            <div class="dropdown-item" data-format="JPG">JPG</div>
                            <div class="dropdown-item" data-format="EPUB">EPUB</div>
                        </div>
                        <div class="select-arrow">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                    </div>
                </div>

                <div class="chapters-grid custom-scrollbar">
                    ${chapters.map((ch, i) => `
                        <div class="chapter-item" data-chapter-index="${i}" onclick='mangaDownloadPage(${JSON.stringify(ch)}, ${JSON.stringify(chaptersData.chaptersLinks[i])}, ${JSON.stringify(chaptersData.title).replace(/'/g, "&apos;")} , ${i})'>
                            <div class="chapter-left">
                                <div class="chapter-icons">
                                    <span class="chapter-download-icon">${chapterDefaultIconSvg}</span>
                                </div>
                                <span class="chapter-name">${ch}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    initDownloadOptionsDropdown(detailView);

}


function saveRecent(manga,currentSource){
    // manga = title, cover, link
    console.log(manga, currentSource)
    
    const recentList = {
        ...manga,
        "currentSource":currentSource
    }
  
    window.pywebview.api.saveRecentCache(recentList)

}

function saveFavorite(manga,currentSource){
    
}
