const COMMENT_ICON = `<img src="icons/comment.png" width="14" height="14" alt="" style="vertical-align:middle;opacity:0.7">`;
const EXT_ICON     = `<img src="icons/link_go.png" width="16" height="16" alt="">`;

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

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const units = [
    [365 * 24 * 3600 * 1000, 'year'],
    [30  * 24 * 3600 * 1000, 'month'],
    [24  *      3600 * 1000, 'day'],
    [          3600 * 1000, 'hour'],
    [            60 * 1000, 'minute'],
  ];
  for (const [ms, unit] of units) {
    const n = Math.floor(diff / ms);
    if (n >= 1) return `${n} ${unit}${n > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

function formatViews(n) {
  if (!n) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

let posts = [];

// ── Sidebar ────────────────────────────────────────

function buildSidebar(config) {
  document.getElementById('blog-name').textContent = config.name;
  document.title = config.name;

  if (config.projects?.length) {
    const section = document.getElementById('projects-section');
    const list    = document.getElementById('projects-list');
    section.hidden = false;
    config.projects.forEach(p => {
      const initial = p.name.charAt(0).toUpperCase();
      const a = document.createElement('a');
      a.className = 'ext-link-item';
      a.href = p.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.innerHTML = `
        <span class="ext-icon" style="background:${p.color ?? '#888'}">${initial}</span>
        <span class="ext-name">${p.name}</span>
        <span class="ext-arrow">${EXT_ICON}</span>
      `;
      list.appendChild(a);
    });
  }

  if (config.online?.length) {
    const section = document.getElementById('online-section');
    const list    = document.getElementById('online-list');
    section.hidden = false;
    config.online.forEach(o => {
      const iconSrc = PLATFORM_ICONS[o.platform] ?? PLATFORM_ICONS.default;
      const a = document.createElement('a');
      a.className = 'ext-link-item';
      a.href = o.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.innerHTML = `
        <span class="ext-icon ext-icon-img"><img src="${iconSrc}" width="16" height="16" alt=""></span>
        <span class="ext-name">${o.name}</span>
        <span class="ext-arrow">${EXT_ICON}</span>
      `;
      list.appendChild(a);
    });
  }
}

// ── Post list ──────────────────────────────────────

function buildPostList() {
  const list = document.getElementById('post-list');
  list.innerHTML = '';
  posts.forEach(post => {
    const li = document.createElement('li');
    li.className = 'post-item';
    li.dataset.slug = post.slug;
    li.innerHTML = `
      <div class="post-item-text">
        <span class="post-item-title">${post.title}</span>
        <span class="post-item-date">${timeAgo(post.date)}</span>
      </div>
      <div class="post-item-count">${COMMENT_ICON} ${post.comments ?? 0}</div>
    `;
    li.addEventListener('click', () => navigate(`#${post.slug}`));
    list.appendChild(li);
  });
}

// ── Views ──────────────────────────────────────────

function setActiveNav(id) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('nav-active'));
  document.getElementById(id)?.classList.add('nav-active');
}

function setMobileView(view) {
  document.getElementById('app').className = `view-${view}`;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('tab-active'));
  const tabId = view === 'article' ? 'tab-posts' : `tab-${view}`;
  document.getElementById(tabId)?.classList.add('tab-active');
}

async function showPosts() {
  document.getElementById('posts-pane').style.display   = '';
  document.getElementById('article-pane').hidden = true;
  document.getElementById('home-pane').hidden    = true;
  setActiveNav('nav-posts');
  setMobileView('posts');
}

async function showHome() {
  const res  = await fetch('about.md');
  const md   = await res.text();
  document.getElementById('home-content').innerHTML = marked.parse(md);
  document.getElementById('posts-pane').style.display   = 'none';
  document.getElementById('article-pane').hidden = true;
  document.getElementById('home-pane').hidden    = false;
  setActiveNav('nav-home');
  setMobileView('home');
  window.scrollTo(0, 0);
  document.getElementById('content').scrollTop = 0;
}

async function showPost(slug) {
  const post = posts.find(p => p.slug === slug);
  if (!post) return;

  // Highlight active in list
  document.querySelectorAll('.post-item').forEach(el =>
    el.classList.toggle('active', el.dataset.slug === slug)
  );

  const res  = await fetch(`posts/${slug}.md`);
  const md   = await res.text();

  document.getElementById('post-title').textContent = post.title;
  const views = formatViews(post.views);
  document.getElementById('post-meta').textContent =
    [timeAgo(post.date), views ? `${views} views` : null].filter(Boolean).join('. ') + '.';
  document.getElementById('post-body').innerHTML = marked.parse(md);

  document.getElementById('posts-pane').style.display   = 'none';
  document.getElementById('article-pane').hidden = false;
  document.getElementById('home-pane').hidden    = true;
  setActiveNav('nav-posts');
  setMobileView('article');
  window.scrollTo(0, 0);
  document.getElementById('content').scrollTop = 0;
}

// ── Routing ────────────────────────────────────────

function navigate(hash, push = true) {
  if (push) history.pushState(null, '', hash || '#');
  const slug = hash.replace(/^#/, '');
  if (!slug || slug === 'posts') { showPosts(); return; }
  if (slug === 'home')           { showHome();  return; }
  showPost(slug);
}

// ── Init ───────────────────────────────────────────

async function init() {
  const [config, postsData] = await Promise.all([
    fetch('config.json').then(r => r.json()),
    fetch('posts/index.json').then(r => r.json()),
  ]);

  posts = postsData;
  buildSidebar(config);
  buildPostList();

  // Sidebar nav buttons
  document.getElementById('nav-home').addEventListener('click',  () => navigate('#home'));
  document.getElementById('nav-posts').addEventListener('click', () => navigate('#posts'));

  // Mobile tab bar
  document.getElementById('tab-home').addEventListener('click',  () => navigate('#home'));
  document.getElementById('tab-posts').addEventListener('click', () => navigate('#posts'));

  window.addEventListener('popstate', () => navigate(location.hash, false));

  // Initial route
  const hash = location.hash;
  if (hash && hash !== '#' && hash !== '#posts') {
    navigate(hash, false);
  } else {
    const isDesktop = window.matchMedia('(min-width: 769px)').matches;
    if (isDesktop && posts.length > 0) {
      showPosts();
      showPost(posts[0].slug);
    } else {
      showPosts();
    }
  }
}

init();
