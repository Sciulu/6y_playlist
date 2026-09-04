document.getElementById('liveBtn').href = CONFIG.liveUrl;
document.getElementById('spaceBtn').href = CONFIG.spaceUrl;

let filteredSongs = []; 
let currentPage = 1;
let selectedInitial = 'ALL';
let currentRandomSong = null;

// ==========================================
// 核心拉取逻辑
// ==========================================
function loadSongsFromSheet() {
    const container = document.getElementById('songList');
    // 修改了加载提示文字
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-sub); padding: 40px 0;">正在整理忍者手账. . .</div>';

    Papa.parse(CONFIG.sheetCsvUrl, {
        download: true,
        header: true,          
        skipEmptyLines: true,  
        complete: function(results) {
            rawSongs = results.data;          
            filteredSongs = [...rawSongs];    
            init();                           
        },
        error: function(err) {
            console.error("读取表格失败:", err);
            container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #d32f2f; padding: 40px 0;">同步歌单失败，请检查表格链接是否正确。</div>';
        }
    });
}

// ==========================================
// 渲染逻辑
// ==========================================
function init() {
    buildFilterOptions();
    buildInitialsBar();
    applyFilters();
}

function buildFilterOptions() {
    const genres = ['all', ...new Set(rawSongs.map(s => s.genre))];
    const artists = ['all', ...new Set(rawSongs.map(s => s.artist))];

    document.getElementById('genreSelect').innerHTML = genres.map(g => `<option value="${g}">${g === 'all' ? '所有曲风' : g}</option>`).join('');
    document.getElementById('artistSelect').innerHTML = artists.map(a => `<option value="${a}">${a === 'all' ? '所有歌手' : a}</option>`).join('');
}

function buildInitialsBar() {
    const letters = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];
    document.getElementById('initialsBar').innerHTML = letters.map(l => 
        `<button class="initial-btn ${l === 'ALL' ? 'active' : ''}" onclick="selectInitial('${l}', this)">${l}</button>`
    ).join('');
}

function selectInitial(letter, btn) {
    document.querySelectorAll('.initial-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedInitial = letter;
    applyFilters();
}

function applyFilters() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const genre = document.getElementById('genreSelect').value;
    const artist = document.getElementById('artistSelect').value;

    filteredSongs = rawSongs.filter(song => {
        const sName = song.name ? song.name.toLowerCase() : '';
        const sArtist = song.artist ? song.artist.toLowerCase() : '';
        const sGenre = song.genre ? song.genre.toLowerCase() : '';
        const sInitial = song.initial ? song.initial.toUpperCase() : '';

        const matchSearch = sName.includes(query) || sArtist.includes(query) || sGenre.includes(query);
        const matchGenre = genre === 'all' || song.genre === genre;
        const matchArtist = artist === 'all' || song.artist === artist;
        const matchInitial = selectedInitial === 'ALL' || sInitial === selectedInitial;

        return matchSearch && matchGenre && matchArtist && matchInitial;
    });

    currentPage = 1;
    renderList();
}

function handleSearch() { applyFilters(); }

function renderList() {
    const container = document.getElementById('songList');
    container.innerHTML = '';

    if (filteredSongs.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-sub); padding: 40px 0;">未找到相关歌曲</div>`;
        document.getElementById('pagination').innerHTML = '';
        return;
    }

    const start = (currentPage - 1) * CONFIG.pageSize;
    const pageSongs = filteredSongs.slice(start, start + CONFIG.pageSize);

    pageSongs.forEach(song => {
        const card = document.createElement('div');
        card.className = 'song-card';
        card.innerHTML = `
            <div class="song-name" title="${song.name}">${song.name}</div>
            <div class="song-meta">
                <span>${song.artist}</span>
                <span class="song-genre">${song.genre}</span>
            </div>
        `;
        card.onclick = () => copyText(`点歌 ${song.name}`);
        container.appendChild(card);
    });

    renderPagination();
}

function renderPagination() {
    const totalPages = Math.ceil(filteredSongs.length / CONFIG.pageSize);
    const pagContainer = document.getElementById('pagination');
    pagContainer.innerHTML = '';

    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.textContent = '‹';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => { currentPage--; renderList(); };
    pagContainer.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            const btn = document.createElement('button');
            btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
            btn.textContent = i;
            btn.onclick = () => { currentPage = i; renderList(); };
            pagContainer.appendChild(btn);
        }
    }

    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.textContent = '›';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => { currentPage++; renderList(); };
    pagContainer.appendChild(nextBtn);
}

function pickRandomSong() {
    if (filteredSongs.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filteredSongs.length);
    currentRandomSong = filteredSongs[randomIndex];

    document.getElementById('randomResult').textContent = currentRandomSong.name;
    document.getElementById('randomMeta').textContent = `原唱：${currentRandomSong.artist} | 曲风：${currentRandomSong.genre}`;
    document.getElementById('randomModal').style.display = 'flex';
}

function copyRandomSong() {
    if (currentRandomSong) {
        copyText(`点歌 ${currentRandomSong.name}`);
        closeModal();
    }
}

function closeModal() {
    document.getElementById('randomModal').style.display = 'none';
}

function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast(`已复制：${text}`);
    }).catch(() => {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("Copy");
        ta.remove();
        showToast(`已复制：${text}`);
    });
}

let toastTimeout;
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = 'show';
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { toast.className = ''; }, 2000);
}

window.onload = loadSongsFromSheet;