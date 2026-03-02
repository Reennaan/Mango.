

window.buildMangaInfo = buildMangaInfo;

window.addEventListener('pywebviewready', initDownloadPage);
window.addEventListener('DOMContentLoaded', initDownloadPage);



document.addEventListener('DOMContentLoaded', function(){
    


    document.querySelector( '.source-select' ).addEventListener( 'change' , function(){
        var source = document.querySelector( '.source-select' ).value;
        document.querySelector( '.popular-recents' ).innerHTML = 'Popular on: ' + source;
    });


    document.querySelector('.feather-folder').addEventListener('click', function(){
        console("foi")
        window.pywebview.api.selectFolder().then(r =>console.log(r));
    })

    


    
})








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

window.mangaDownloadPage = function(chapters, img, mangaTitle, downloadLink) {
    const chaptersContainer = document.querySelector('.chaptersContainer');
    const imgContainer = document.querySelector('.imgContainer');
    if (!chaptersContainer) return;

    const mangaImg = document.createElement('img');
    mangaImg.src = img;

    imgContainer.appendChild(mangaImg);

    chaptersContainer.innerHTML = '';
    


    chapters.forEach((chapterName, index) => {
        const cList = document.createElement('h3');
        cList.textContent = chapterName;
        //slug foi necessario pois a url da api é diferente da ui
        console.log(downloadLink)
        cList.onclick = (e) => {
            e.preventDefault();
            slug = downloadLink[index].split("/").slice(2).join("/").split("/")[0];
            chapter = downloadLink[index].split("/")[4]
            
            window.pywebview.api.downloadFile(slug,chapter)
        };

        chaptersContainer.appendChild(cList);
    });

    return "";
}

async function initDownloadPage() {
    const isDownloadPage = document.querySelector('.chaptersContainer');
    if (!isDownloadPage || !window.pywebview?.api?.getPendingDownloadData) return;

    const data = await window.pywebview.api.getPendingDownloadData();
    if (!data) return;

    window.mangaDownloadPage(data.chapters, data.img, data.title, data.downloadLinks); 
}



async function renderMangaDetails(manga) {
    const detailView = document.getElementById('detail-view');
    if (!detailView) return;

   
    detailView.innerHTML = `<div class="empty-state"><p>Loading chapters...</p></div>`;

   
    let chaptersData = null;
    try {
        
        const result = await window.pywebview.api.getChapters(manga.imgUrl, manga.href, manga.title);
        chaptersData = await window.pywebview.api.getPendingDownloadData();
        console.log(chaptersData)
    } catch (e) {
        detailView.innerHTML = `<div class="empty-state"><p>error when searching for chapters</p></div>`;
        console.error("erro ao buscar capítulos:", e);
    }

    if (!chaptersData) {
        detailView.innerHTML = `<div class="empty-state"><p>Failed to load chapters.</p></div>`;
        return;
    }

    const { chapters, img, title, downloadLinks } = chaptersData;

    detailView.innerHTML = `
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
                    
                    <h1 class="manga-title-large">${title}</h1>
                    
                    <p class="manga-desc">
                        Hole—a dark, decrepit, and disorderly district where the strong prey on the weak and death is an ordinary occurrence—is all but befitting of the name given to it. A realm separated from law and ethics, it is a testing ground to the magic users who dominate it.
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
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-folder" style="pointer-events: all; cursor: pointer;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
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

                <div class="chapters-grid">
                    ${chapters.map((ch, i) => `
                        <div class="chapter-item" onclick="downloadChapter('${downloadLinks[i]}')">
                            <div class="chapter-left">
                                <div class="chapter-icons">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
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