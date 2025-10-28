
const artistsEl = document.getElementById('artists');
const searchEl = document.getElementById('search');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');
const adminBtn = document.getElementById('adminBtn');

let artists = [];

fetch('data/artists.json')
  .then(r => r.json())
  .then(data => {
    artists = data;
    renderList(artists);
  })
  .catch(err => {
    console.error('Failed to load artists.json', err);
    artistsEl.innerHTML = '<li style="color:var(--muted)">No artist data yet. Add artists.json in /data/</li>';
  });

function renderList(list){
  if(!list || !list.length){
    artistsEl.innerHTML = '<li style="color:var(--muted)">No artists yet.</li>';
    return;
  }
  artistsEl.innerHTML = '';
  list.forEach((a, index) => {
    const li = document.createElement('li');
    li.className = 'artist-card';
    li.style.animationDelay = `${index * 0.05}s`;
    li.tabIndex = 0;
    li.innerHTML = `
      <img class="artist-thumb" src="${a.image || 'assets/default.jpg'}" alt="${escapeHtml(a.name)}">
      <div class="artist-info">
        <div class="artist-name">${escapeHtml(a.name)}</div>
        <div class="artist-meta">${escapeHtml(a.followers || '—')}</div>
      </div>
    `;
    li.addEventListener('click', ()=> openDetail(a));
    li.addEventListener('keypress', (e)=>{ if(e.key==='Enter') openDetail(a); });
    artistsEl.appendChild(li);
  });
}

searchEl.addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  renderList(artists.filter(a => a.name.toLowerCase().includes(q)));
});

function openDetail(a){
  modalBody.innerHTML = `
    <div class="artist-detail">
      <img src="${a.image || 'assets/default.jpg'}" alt="${escapeHtml(a.name)}">
      <div>
        <h2>${escapeHtml(a.name)}</h2>
        <p class="meta">Followers: ${escapeHtml(a.followers || '—')}</p>
        <p style="color:var(--muted);margin-top:8px">${escapeHtml(a.bio || '')}</p>
        <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
          ${a.spotify ? `<a target="_blank" rel="noopener" href="${a.spotify}"><button class="btn">Spotify</button></a>` : ''}
          ${a.soundcloud ? `<a target="_blank" rel="noopener" href="${a.soundcloud}"><button class="btn">SoundCloud</button></a>` : ''}
          ${a.instagram ? `<a target="_blank" rel="noopener" href="${a.instagram}"><button class="btn">Instagram</button></a>` : ''}
        </div>
      </div>
    </div>
  `;
  modal.classList.remove('hidden');
}

modalClose.addEventListener('click', ()=> modal.classList.add('hidden'));
modal.addEventListener('click', (e)=> { if(e.target === modal) modal.classList.add('hidden'); });
document.getElementById('year').textContent = new Date().getFullYear();

adminBtn.addEventListener('click', ()=> {
  window.location.href = 'admin.html';
});

// simple sanitizer
function escapeHtml(s){ return String(s || '').replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])) }
