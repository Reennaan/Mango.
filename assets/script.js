window.buildMangaInfo = buildMangaInfo;


window.addEventListener('pywebviewready', initDownloadPage);
window.addEventListener('DOMContentLoaded', initDownloadPage);



document.querySelector( '.source-select' ).addEventListener( 'change' , function(){
    var source = document.querySelector( '.source-select' ).value;
    if(source != "Select the source"){
        document.querySelector( '.popular-recents' ).innerHTML = 'Popular on: ' + source;
        window.pywebview.api.changeProvider(source);
        document.getElementById('library-container').innerHTML = ""
        window.pywebview.api.genericFetch();
    }
    
});


document.addEventListener('click', async function (event) {
    const folderButton = event.target.closest('.folder-button');
    if (!folderButton) return;

    //console.log("foi");
    try {
        const selected = await window.pywebview.api.selectFolder();
        //console.log(selected);
    } catch (error) {
        console.error('erro ao selecionar pasta:', error);
    }
});






async function buildMangaInfo(title, imgUrl, href) {
    const container = document.getElementById('library-container');
    if (!container) return;

    const card = document.createElement('div');
    card.className = 'mangaCard';
    card.innerHTML = `
        <img src="${imgUrl}" class="cardImg" alt="${title}" referrerPolicy="no-referrer">
        <h3 class="titleCard">${title}</h3>
    `;

    card.onclick = () => {
        
        document.querySelectorAll('.mangaCard').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
    
        renderMangaDetails({ title, imgUrl, href });
    };

    container.appendChild(card);
}

const chapterDefaultIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" x2="12" y1="15" y2="3"/>
</svg>
`;

const chapterLoadingIconDataUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 24 24'%3E%3C!-- Icon from SVG Spinners by Utkarsh Verma - https://github.com/n3r4zzurr0/svg-spinners/blob/main/LICENSE --%3E%3Cpath fill='currentColor' d='M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z'%3E%3CanimateTransform attributeName='transform' dur='0.75s' repeatCount='indefinite' type='rotate' values='0 12 12;360 12 12'/%3E%3C/path%3E%3C/svg%3E";

function setChapterDownloadIcon(chapterIndex, isLoading) {
    const iconContainer = document.querySelector(`.chapter-item[data-chapter-index="${chapterIndex}"] .chapter-download-icon`);
    if (!iconContainer) return;

    if (isLoading) {
        iconContainer.innerHTML = `<img src="${chapterLoadingIconDataUrl}" alt="downloading" style="width:14px;height:14px;display:block;">`;
        return;
    }

    iconContainer.innerHTML = chapterDefaultIconSvg;
}

window.mangaDownloadPage = async function(  chapters, downloadLink , title , chapterIndex) {
    if (!downloadLink || Array.isArray(downloadLink)) return "";
    console.log(downloadLink, chapters, title)

    //const urlStr = downloadLink.toString();
    //const parts = urlStr.split("/");

    //let slug = parts.slice(2).join("/").split("/")[0];
    //let chapter = parts[4];

    setChapterDownloadIcon(chapterIndex, true);
    try {
        console.log(downloadLink, chapters, title)
        await window.pywebview.api.genericDownload(downloadLink,chapters,title);
        //await window.pywebview.api.downloadFile(slug, chapter);
    } catch (error) {
        console.error("erro ao baixar capitulo:", error);
    } finally {
        setChapterDownloadIcon(chapterIndex, false);
    }

    return "";
}

async function initDownloadPage() {
    const isDownloadPage = document.querySelector('.chaptersContainer');
    if (!isDownloadPage || !window.pywebview?.api?.getPendingDownloadData) return;

    const data = await window.pywebview.api.getPendingDownloadData();
    if (!data) return;

    window.mangaDownloadPage( data.chapters,data.downloadLinks, data.title); 
}



async function renderMangaDetails(manga) {
    const detailView = document.getElementById('detail-view');
    if (!detailView) return;

    const extensionMarkup = `
        <div id="extension" style="position: absolute; top: 0; right: 0; padding: 1rem;">
            <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="z-index: 200;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 0 1-.657.643 48.39 48.39 0 0 1-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 0 1-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 0 0-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 0 1-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 0 0 .657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 0 0 5.427-.63 48.05 48.05 0 0 0 .582-4.717.532.532 0 0 0-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 0 0 .658-.663 48.422 48.422 0 0 0-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 0 1-.61-.58v0Z" />
            </svg>
        </div>
    `;

   
    detailView.innerHTML = `${extensionMarkup}<div class="empty-state"><p>Loading chapters...</p></div>`;

   
    let chaptersData = null;
    try {
        
        const withTimeout = (promise, timeoutMs, message) => Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error(message)), timeoutMs))
        ]);

        await withTimeout(
            window.pywebview.api.genericGetDetails(manga.imgUrl, manga.href, manga.title),
            15000,
            "Timeout while loading chapters."
        );
        chaptersData = await withTimeout(
            window.pywebview.api.getPendingDownloadData(),
            5000,
            "Timeout while reading chapters data."
        );
        console.log(chaptersData)
    
    } catch (e) {
        detailView.innerHTML = `${extensionMarkup}<div class="empty-state"><p>error when searching for chapters</p></div>`;
        console.error("erro ao buscar capítulos:", e);
    }

    if (!chaptersData) {
        detailView.innerHTML = `${extensionMarkup}<div class="empty-state"><p>Failed to load chapters.</p></div>`;
        return;
    }

    const {
        chapters = [],
        img = "",
        title = "",
        downloadLinks = [],
        desc = "",
        author = ""
    } = chaptersData || {};
    const authorText = typeof author === "string" && author.trim() ? author : "Unknown author";
    const rawDescText = Array.isArray(desc) ? desc.join(" ") : (desc || "Description not available.");
    const descText = rawDescText.length > 450 ? `${rawDescText.slice(0, 450)}(...)` : rawDescText;


    detailView.innerHTML = `
        ${extensionMarkup}
        <div class="detail-bg">
            <img src="${img}" alt="" referrerPolicy="no-referrer">
            <div class="detail-gradient"></div>
        </div>

        <div class="detail-content custom-scrollbar">
            <div class="manga-header">
                <div class="manga-cover-large">
                    <img src="${img}" alt="${title}" referrerPolicy="no-referrer">
                </div>
                <div class="manga-info">
                    <div class="text-white/40 text-xs font-medium mb-2 uppercase tracking-widest">story & art by</div>
                    <div class="text-4xl font-bold mb-8 text-white/80">${authorText}</div>
                    <h1 class="manga-title-large">${title}</h1>
                    
                    <p class="manga-desc">
                        ${descText}
                    </p>
                </div>
                <div class="backgorund-manga"></div>
            </div>

            <div class="chapters-section">
                <div class="section-header">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <h3 style="font-size: 1.5rem; font-weight: 600;">Chapters</h3>
                        <div style="display: flex; gap: 0.5rem; color: rgba(255,255,255,0.2);">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="cursor: pointer"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"/></svg>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="cursor: pointer"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                            <div class="folder-button">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-folder" style="pointer-events: all; cursor: pointer;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                            </div>
                        
                        
                        </div>
                    </div>
                    <div class="select-wrapper download-options" style="width: 50px;">
                        <select class="input-field donwload-selection">
                            <option>Download options</option>
                            <option>PDF</option>
                            <option>jpeg</option>
                            <option>EPUB</option>
                        </select>
                        <div class="select-arrow">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                    </div>
                </div>

                <div class="chapters-grid custom-scrollbar">
                    ${chapters.map((ch, i) => `
                        <div class="chapter-item" data-chapter-index="${i}" onclick="mangaDownloadPage('${chaptersData.chapters[i]}', '${chaptersData.downloadLinks[i]}','${chaptersData.title}')">
                            <div class="chapter-left">
                                <div class="chapter-icons">
                                    <span class="chapter-download-icon">${chapterDefaultIconSvg}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                                </div>
                                <span class="chapter-name">${ch}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}
