document.getElementById('liveBtn').href = CONFIG.liveUrl;
document.getElementById('spaceBtn').href = CONFIG.spaceUrl;

let filteredSongs = []; 
let currentPage = 1;
let selectedInitial = 'ALL';
let currentRandomSong = null;

// 初始化 Supabase 数据库
const supabase = supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);

// ==========================================
// 1. 获取 CSV 歌单并加载
// ==========================================
function loadSongsFromSheet() {
    const container = document.getElementById('songList');
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-sub); padding: 40px 0;">正在整理忍者手账...</div>';

    Papa.parse(CONFIG.sheetCsvUrl, {
        download: true,
        header: true,          
        skipEmptyLines: true,  
        complete: function(results) {
            rawSongs = results.data;          
            filteredSongs = [...rawSongs];    
            
            const totalCountElement = document.getElementById('totalCount');
            if(rawSongs.length > 0) {
                totalCountElement.innerText = `# 当前已收录 ${rawSongs.length} 首曲目`;
            } else {
                totalCountElement.innerText = `# 暂未收录曲目`;
            }

            init();                           
        },
        error: function(err) {
            console.error("读取表格失败:", err);
            container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #d32f2f; padding: 40px 0;">同步歌单失败，请检查文件路径。</div>';
        }
    });
}

function init() {
    buildFilterOptions();
    buildInitialsBar();
    applyFilters();
    loadWishes(); // 加载许愿板
}

// ==========================================
// 2. 核心渲染与排序 (包含了 NEW 标签置顶)
// ==========================================
function applyFilters() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const genre = document.getElementById('genreSelect').value;
    const artist = document.getElementById('artistSelect').value;

    let tempSongs = rawSongs.filter(song => {
        const sName = song.name ? song.name.toLowerCase() : '';
        const sArtist = song.artist ? song.artist.toLowerCase() : '';
        const sGenre = song.genre ? song.genre.toLowerCase() : '';
        const sInitial = song.initial ? song.initial.toUpperCase() : '';
        const sTag = song.tag ? song.tag.toUpperCase() : ''; // 允许在 tag 或者 genre 里加 NEW

        const matchSearch = sName.includes(query) || sArtist.includes(query) || sGenre.includes(query);
        const matchGenre = genre === 'all' || song.genre === genre;
        const matchArtist = artist === 'all' || song.artist === artist;
        const matchInitial = selectedInitial === 'ALL' || sInitial === selectedInitial;

        return matchSearch && matchGenre && matchArtist && matchInitial;
    });

    // 排序核心逻辑：有 tag=NEW 的强制排在最前面
    tempSongs.sort((a, b) => {
        const aIsNew = (a.tag && a.tag.toUpperCase() === 'NEW') ? 1 : 0;
        const bIsNew = (b.tag && b.tag.toUpperCase() === 'NEW') ? 1 : 0;
        return bIsNew - aIsNew; 
    });

    filteredSongs = tempSongs;
    currentPage = 1;
    renderList();
}

function renderList() {
    const container = document.getElementById('songList');
    container.innerHTML = '';

    if (filteredSongs.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-sub); padding: 40px 0;">没找到相关的歌本记录呢</div>`;
        document.getElementById('pagination').innerHTML = '';
        return;
    }

    const start = (currentPage - 1) * CONFIG.pageSize;
    const pageSongs = filteredSongs.slice(start, start + CONFIG.pageSize);

    pageSongs.forEach(song => {
        const isNew = song.tag && song.tag.toUpperCase() === 'NEW';
        const card = document.createElement('div');
        card.className = 'song-card';
        card.innerHTML = `
            ${isNew ? '<div class="new-badge">NEW</div>' : ''}
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

// ---------------- 以下为搜索栏与翻页 (原样保留) ----------------
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
function handleSearch() { applyFilters(); }
function renderPagination() {
    const totalPages = Math.ceil(filteredSongs.length / CONFIG.pageSize);
    const pagContainer = document.getElementById('pagination');
    pagContainer.innerHTML = '';
    if (totalPages <= 1) return;
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn'; prevBtn.textContent = '‹'; prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => { currentPage--; renderList(); window.scrollTo({ top: 300, behavior: 'smooth' }); };
    pagContainer.appendChild(prevBtn);
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            const btn = document.createElement('button');
            btn.className = `page-btn ${i === currentPage ? 'active' : ''}`; btn.textContent = i;
            btn.onclick = () => { currentPage = i; renderList(); window.scrollTo({ top: 300, behavior: 'smooth' }); };
            pagContainer.appendChild(btn);
        }
    }
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn'; nextBtn.textContent = '›'; nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => { currentPage++; renderList(); window.scrollTo({ top: 300, behavior: 'smooth' }); };
    pagContainer.appendChild(nextBtn);
}


// ==========================================
// 3. 许愿墙与数据库交互逻辑
// ==========================================

// 读取前 8 条许愿数据
async function loadWishes() {
    const board = document.getElementById('emaBoard');
    board.innerHTML = ''; // 清空加载中提示

    try {
        const { data, error } = await supabase
            .from('wishes')
            .select('*')
            .order('id', { ascending: false }) // 按时间倒序
            .limit(8);
            
        if (error) throw error;
        
        // 渲染 8 个位置，如果有数据填数据，没数据填空板
        for (let i = 0; i < 8; i++) {
            const wish = data[i];
            const card = document.createElement('div');
            card.className = 'ema-card';
            
            if (wish) {
                // 有数据
                let statusHtml = '';
                if(wish.status) {
                    statusHtml = `<div class="ema-status">${wish.status}</div>`;
                }
                const safeName = wish.nickname ? wish.nickname : '匿名观众';
                card.innerHTML = `
                    <div class="ema-song">${wish.song}</div>
                    <div class="ema-name">- ${safeName}</div>
                    ${statusHtml}
                `;
            } else {
                // 没数据，空位
                card.innerHTML = `<div class="ema-empty">虚位以待<br>等你许愿</div>`;
            }
            board.appendChild(card);
        }
    } catch (err) {
        console.error("加载许愿失败", err);
        board.innerHTML = '<div style="grid-column: 1/-1; text-align: center; font-size:12px;">似乎与神明的连接暂时中断了...</div>';
    }
}

// 许愿弹窗开关
function openWishModal() {
    document.getElementById('makeWishModal').style.display = 'flex';
}
function closeWishModal() {
    document.getElementById('makeWishModal').style.display = 'none';
}

// 提交许愿
async function submitWish() {
    const song = document.getElementById('wishSong').value.trim();
    const singer = document.getElementById('wishSinger').value.trim();
    const nickname = document.getElementById('wishName').value.trim();

    if (!song) {
        showToast("至少得写个歌名呀！");
        return;
    }

    // 防刷拦截：今天是否许过愿
    const today = new Date().toDateString();
    const lastWishDate = localStorage.getItem('lastWishDate');
    if (lastWishDate === today) {
        showToast("今天已经许过一次愿啦，明天再来吧！");
        closeWishModal();
        return;
    }

    const btn = document.getElementById('submitWishBtn');
    btn.textContent = "挂绘马中...";
    btn.disabled = true;

    try {
        const { error } = await supabase
            .from('wishes')
            .insert([{ song: song, singer: singer, nickname: nickname }]);

        if (error) throw error;

        // 成功！放烟花特效
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ff9a9e', '#fecfef', '#ffffff']
        });
        
        // 记录本地日期
        localStorage.setItem('lastWishDate', today);
        
        showToast("许愿成功！已挂上绘马墙");
        closeWishModal();
        
        // 清空输入框并刷新许愿板
        document.getElementById('wishSong').value = '';
        document.getElementById('wishSinger').value = '';
        document.getElementById('wishName').value = '';
        loadWishes();

    } catch (err) {
        console.error("提交失败", err);
        showToast("许愿失败了，请稍后再试");
    } finally {
        btn.textContent = "奉纳许愿";
        btn.disabled = false;
    }
}


// ==========================================
// 其他基础组件 (不变)
// ==========================================
function pickRandomSong() {
    if (filteredSongs.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filteredSongs.length);
    currentRandomSong = filteredSongs[randomIndex];
    document.getElementById('randomResult').textContent = currentRandomSong.name;
    document.getElementById('randomMeta').textContent = `原唱：${currentRandomSong.artist} | 曲风：${currentRandomSong.genre}`;
    document.getElementById('randomModal').style.display = 'flex';
}
function copyRandomSong() {
    if (currentRandomSong) { copyText(`点歌 ${currentRandomSong.name}`); closeModal(); }
}
function closeModal() { document.getElementById('randomModal').style.display = 'none'; }
function copyText(text) {
    navigator.clipboard.writeText(text).then(() => { showToast(`已复制：${text}`); })
    .catch(() => {
        const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta);
        ta.select(); document.execCommand("Copy"); ta.remove(); showToast(`已复制：${text}`);
    });
}
let toastTimeout;
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg; toast.className = 'show';
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { toast.className = ''; }, 2000);
}
function playAvatarAnim() {
    const wrapper = document.querySelector('.avatar-wrapper');
    wrapper.classList.remove('avatar-bounce');
    void wrapper.offsetWidth;
    wrapper.classList.add('avatar-bounce');
}

window.onload = loadSongsFromSheet;