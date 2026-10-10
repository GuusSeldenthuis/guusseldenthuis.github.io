const PLATFORM_ICONS = {
  twitter:   'icons/world_go.png',
  youtube:   'icons/film.png',
  github:    'icons/page_white_code.png',
  instagram: 'icons/camera.png',
  tiktok:    'icons/film.png',
  email:     'icons/email.png',
  linkedin:  'icons/vcard.png',
  default:   'icons/world_go.png',
};

const TAG_COLORS = ['var(--yellow)', 'var(--mint)', 'var(--blue)', 'var(--pink)'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// Same tag always gets the same colour
function tagColor(tag) {
  let h = 0;
  for (const c of tag) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TAG_COLORS[h % TAG_COLORS.length];
}

function renderTags(tags = []) {
  return tags.map(t =>
    `<span class="tag" style="background:${tagColor(t)}">${t}</span>`
  ).join('');
}

let posts = [];

// ── Hero ───────────────────────────────────────────

function buildHero(config, aboutMd) {
  document.getElementById('blog-name').textContent = config.name;
  document.title = config.name;
  document.getElementById('hero-content').innerHTML = marked.parse(aboutMd);
  document.getElementById('site-footer').textContent =
    `© ${new Date().getFullYear()} ${config.name}`;

  const links = document.getElementById('hero-links');

  (config.projects ?? []).forEach(p => {
    const a = document.createElement('a');
    a.className = 'link-btn';
    a.href = p.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.innerHTML = `
      <span class="project-initial" style="background:${p.color ?? '#888'}">${p.name.charAt(0).toUpperCase()}</span>
      ${p.name}
      <img src="icons/link_go.png" width="16" height="16" alt="">
    `;
    links.appendChild(a);
  });

  (config.online ?? []).forEach(o => {
    const a = document.createElement('a');
    a.className = 'link-btn';
    a.href = o.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.innerHTML = `
      <img src="${PLATFORM_ICONS[o.platform] ?? PLATFORM_ICONS.default}" width="16" height="16" alt="">
      ${o.name}
    `;
    links.appendChild(a);
  });
}

// ── Post list ──────────────────────────────────────

function buildPostList() {
  const list = document.getElementById('post-list');
  list.innerHTML = '';

  if (!posts.length) {
    list.innerHTML = `<li class="empty">Nothing here yet. Check back soon!</li>`;
    return;
  }

  posts.forEach(post => {
    const li = document.createElement('li');
    li.innerHTML = `
      <a class="post-item" href="#${post.slug}">
        <span class="post-item-date">${formatDate(post.date)}</span>
        <span class="post-item-title">${post.title}</span>
        <span class="tags">${renderTags(post.tags)}</span>
      </a>
    `;
    list.appendChild(li);
  });
}

// ── Views ──────────────────────────────────────────

function showView(id) {
  document.getElementById('home-view').hidden = id !== 'home-view';
  document.getElementById('post-view').hidden = id !== 'post-view';
  window.scrollTo(0, 0);
}

function showHome() {
  document.title = document.getElementById('blog-name').textContent;
  showView('home-view');
}

async function showPost(slug) {
  const post = posts.find(p => p.slug === slug);
  if (!post) { showHome(); return; }

  const res = await fetch(`posts/${slug}.md`);
  const md  = await res.text();

  document.title = `${post.title} · ${document.getElementById('blog-name').textContent}`;
  document.getElementById('post-tags').innerHTML    = renderTags(post.tags);
  document.getElementById('post-title').textContent = post.title;
  document.getElementById('post-meta').textContent  = formatDate(post.date);
  document.getElementById('post-body').innerHTML    = marked.parse(md);
  showView('post-view');
}

// ── Routing ────────────────────────────────────────

function route() {
  const slug = location.hash.replace(/^#/, '');
  if (!slug || slug === 'home' || slug === 'posts') showHome();
  else showPost(slug);
}

// ── Init ───────────────────────────────────────────

async function init() {
  const [config, postsData, aboutMd] = await Promise.all([
    fetch('config.json').then(r => r.json()),
    fetch('posts/index.json').then(r => r.json()),
    fetch('about.md').then(r => r.text()),
  ]);

  posts = postsData;
  buildHero(config, aboutMd);
  buildPostList();

  window.addEventListener('hashchange', route);
  route();
}

init();
