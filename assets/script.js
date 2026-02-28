async function buildMangaInfo(title,imgUrl,href) {
    const container = document.querySelector('.data-container');
    if (!container) return;

    const card = document.createElement('div');
    card.className = 'mangaCard';

    const link = document.createElement('a');
    //link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    const titleEl = document.createElement('h3');
    titleEl.className = 'titleCard';
    titleEl.textContent = title;

    const img = document.createElement('img');
    img.className = 'cardImg';
    img.src = imgUrl;

    link.appendChild(img);
    link.appendChild(titleEl);

    card.appendChild(link);

    container.appendChild(card);
    card.onclick = async () => window.pywebview.api.mangaDownloadPage(imgUrl,href)

}

async function download(link) {
    
}

window.buildMangaInfo = buildMangaInfo;
