(() => {
  'use strict';

  const USER = 'BoyidapuMaheshBabu';
  const API = 'https://api.github.com';
  const CURATED = new Set(['TermRunway-Android', 'RESUP', 'Problem-Solving-Logic', 'jjk', 'TermRunway-Web']);
  const byId = (id) => document.getElementById(id);
  const $ = (selector, root = document) => root.querySelector(selector);
  const state = {
    repos: [], repo: null, path: '', items: [], selectedPath: '',
    apiCalls: 0, previewCache: new Map(), revealObserver: null
  };

  const languageColors = {
    JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572a5',
    Kotlin: '#a97bff', HTML: '#e34c26', CSS: '#663399',
    Java: '#b07219', C: '#555555', 'C++': '#f34b7d',
    Shell: '#89e051', Markdown: '#8b8b8b', Dart: '#00b4ab',
    Swift: '#f05138', Go: '#00add8', Rust: '#dea584'
  };

  const iconFor = (item) => {
    if (item.type === 'dir') return '▰';
    const extension = (item.name.split('.').pop() || '').toLowerCase();
    const map = {
      md: 'M', html: '◉', css: '◈', scss: '◈', js: 'JS',
      ts: 'TS', tsx: 'TSX', jsx: 'JSX', json: '{}', kt: 'K',
      java: 'J', py: 'Py', yml: '⚙', yaml: '⚙', xml: '<>',
      gradle: 'G', kts: 'G', txt: '≡', sh: '$', svg: '◇',
      png: '▧', jpg: '▧', jpeg: '▧', webp: '▧', gif: '▧',
      pdf: 'PDF', lock: '⊙', gitignore: 'G', properties: '⚙'
    };
    return map[extension] || '·';
  };

  const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);

  const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    const now = new Date();
    const days = Math.floor((now - date) / 86400000);
    if (days < 1) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 30) return days + ' days ago';
    if (days < 365) return Math.floor(days / 30) + ' mo ago';
    return Math.floor(days / 365) + ' yr ago';
  };

  const formatNumber = (value) => new Intl.NumberFormat('en', { notation: value >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value || 0);

  async function githubFetch(url) {
    state.apiCalls += 1;
    const response = await fetch(url, {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store'
    });
    if (!response.ok) {
      const remaining = response.headers.get('X-RateLimit-Remaining');
      if (response.status === 403 && remaining === '0') {
        throw new Error('GitHub API rate limit reached. Wait a little, or open the repositories directly on GitHub.');
      }
      if (response.status === 404) throw new Error('This repository path is not available. It may have been moved or removed.');
      if (response.status === 409 || response.status === 422) throw new Error('GitHub could not read this folder right now. Try the repository root.');
      throw new Error('GitHub responded with ' + response.status + '. Please try again shortly.');
    }
    return response.json();
  }

  function setAPIStatus(label, mode = '') {
    const element = byId('api-status');
    if (!element) return;
    element.textContent = label;
    element.parentElement.classList.toggle('lab-live--error', mode === 'error');
  }

  function renderStats(repos, profile) {
    byId('repo-stat').textContent = formatNumber(repos.length);
    byId('followers-stat').textContent = formatNumber(profile.followers || 0);
    const latest = [...repos].filter(repo => !repo.fork).sort((a, b) => new Date(b.pushed_at || 0) - new Date(a.pushed_at || 0))[0];
    byId('latest-stat').textContent = latest ? formatDate(latest.pushed_at) : '—';
    byId('latest-repo').textContent = latest ? latest.name : 'No recent public activity';
  }

  function renderRepoWall(repos) {
    const wall = byId('live-repo-grid');
    const items = repos.filter(repo => !CURATED.has(repo.name)).slice(0, 6);
    if (!items.length) {
      wall.innerHTML = '<div class="repo-loading glass-panel">The featured projects above cover the public repositories currently available.</div>';
      return;
    }
    wall.innerHTML = items.map(repo => {
      const language = repo.language || 'Mixed / docs';
      const colour = languageColors[repo.language] || '#a88bff';
      const description = repo.description || 'A public repository in my learning and development journey.';
      return `<article class="live-repo-card glass-panel">
        <div class="live-repo-title-row"><span class="live-repo-folder">▰</span><div><h4>${escapeHTML(repo.name)}</h4><span class="repo-visibility">${repo.fork ? 'FORKED REPOSITORY' : 'PUBLIC REPOSITORY'}</span></div></div>
        <p>${escapeHTML(description)}</p>
        <div class="live-repo-meta"><span class="repo-language"><i class="language-dot" style="background:${colour}"></i>${escapeHTML(language)}</span><a href="${escapeHTML(repo.html_url)}" target="_blank" rel="noreferrer">Explore ↗</a></div>
      </article>`;
    }).join('');
    if (items.length < repos.filter(repo => !CURATED.has(repo.name)).length) {
      wall.insertAdjacentHTML('beforeend', '<a class="live-repo-card glass-panel all-repos-card" href="https://github.com/' + USER + '?tab=repositories"><div class="live-repo-title-row"><span class="live-repo-folder">↗</span><div><h4>Explore every repository</h4><span class="repo-visibility">OPEN THE FULL COLLECTION</span></div></div><p>The source of truth is always GitHub. Browse all public repositories, branches, commits, and files.</p><div class="live-repo-meta"><span>GitHub profile</span><span>Open ↗</span></div></a>');
    }
  }

  function populateRepoSelect(repos) {
    const select = byId('repo-select');
    const sorted = [...repos].sort((a, b) => {
      const curatedRank = (name) => ({
        'TermRunway-Android': 0, RESUP: 1, 'Problem-Solving-Logic': 2,
        jjk: 3, 'TermRunway-Web': 4
      }[name] ?? 10);
      return curatedRank(a.name) - curatedRank(b.name) || a.name.localeCompare(b.name);
    });
    select.innerHTML = sorted.map(repo =>
      '<option value="' + escapeHTML(repo.name) + '">' + escapeHTML(repo.name) + '</option>'
    ).join('');
    const preferred = sorted.find(repo => repo.name === 'TermRunway-Android') || sorted.find(repo => repo.name !== 'Portfolio-') || sorted[0];
    if (preferred) {
      select.value = preferred.name;
      setCurrentRepo(preferred.name);
    }
  }

  function renderFileList(items) {
    const query = byId('file-search').value.trim().toLowerCase();
    const filtered = items.filter(item => item.name.toLowerCase().includes(query));
    const list = byId('file-list');
    byId('file-count').textContent = filtered.length + (filtered.length === 1 ? ' ITEM' : ' ITEMS');

    if (!filtered.length) {
      list.innerHTML = '<div class="empty-state"><span>⌕</span><p>No matching files in this folder.</p></div>';
      return;
    }

    list.innerHTML = filtered.map(item => {
      const selected = state.selectedPath === item.path ? ' is-selected' : '';
      const cls = item.type === 'dir' ? ' dir' : '';
      const kind = item.type === 'dir' ? 'FOLDER' : (item.size != null ? formatNumber(item.size) + ' B' : 'FILE');
      return '<button type="button" class="file-row' + cls + selected + '" data-path="' + escapeHTML(item.path) + '" data-type="' + escapeHTML(item.type) + '" aria-label="' + escapeHTML((item.type === 'dir' ? 'Open folder ' : 'Preview file ') + item.name) + '">' +
        '<span class="file-glyph">' + iconFor(item) + '</span><span class="file-name">' + escapeHTML(item.name) + '</span><span class="file-kind">' + kind + '</span></button>';
    }).join('');
  }

  function renderBreadcrumb() {
    const root = byId('breadcrumb');
    const parts = state.path ? state.path.split('/').filter(Boolean) : [];
    let html = '<button type="button" class="crumb-button" data-breadcrumb-depth="0">⌂ ' + escapeHTML(state.repo ? state.repo.name : 'Repository') + '</button>';
    let progressive = '';
    parts.forEach((part, index) => {
      progressive = progressive ? progressive + '/' + part : part;
      html += '<span class="crumb-separator">/</span><button type="button" class="crumb-button" data-breadcrumb-depth="' + (index + 1) + '">' + escapeHTML(part) + '</button>';
    });
    root.innerHTML = html;
  }

  function repoFileURL(repo, path) {
    const branch = repo.default_branch || 'main';
    return 'https://github.com/' + USER + '/' + encodeURIComponent(repo.name) + '/blob/' + encodeURIComponent(branch) + (path ? '/' + path.split('/').map(encodeURIComponent).join('/') : '');
  }

  function folderURL(repo, path) {
    const branch = repo.default_branch || 'main';
    return 'https://github.com/' + USER + '/' + encodeURIComponent(repo.name) + '/tree/' + encodeURIComponent(branch) + (path ? '/' + path.split('/').map(encodeURIComponent).join('/') : '');
  }

  function showEmptyPreview() {
    byId('file-preview').innerHTML = '<div class="preview-empty"><div class="preview-glyph">⌘</div><span class="case-overline">SOURCE VIEWER</span><h3>A closer look.</h3><p>Select a file to preview its contents here. Open the complete file on GitHub for the full experience.</p><div class="preview-shortcuts"><span>README.md</span><span>src/</span><span>docs/</span></div></div>';
  }

  async function setCurrentRepo(name) {
    const repo = state.repos.find(item => item.name === name);
    if (!repo) return;
    state.repo = repo;
    state.path = '';
    state.items = [];
    state.selectedPath = '';
    byId('repo-open').href = repo.html_url;
    byId('file-search').value = '';
    renderBreadcrumb();
    await loadPath('');
  }

  async function loadPath(path) {
    if (!state.repo) return;
    state.path = path;
    state.selectedPath = '';
    renderBreadcrumb();
    byId('file-list').innerHTML = '<div class="empty-state"><span class="loading-spinner"></span><p>Loading this folder from GitHub…</p></div>';
    byId('file-count').textContent = 'LOADING';
    showEmptyPreview();
    const url = API + '/repos/' + USER + '/' + encodeURIComponent(state.repo.name) + '/contents' + (path ? '/' + path.split('/').map(encodeURIComponent).join('/') : '') + '?ref=' + encodeURIComponent(state.repo.default_branch || 'main');
    try {
      const items = await githubFetch(url);
      if (!Array.isArray(items)) throw new Error('This path is a file. Select a folder to browse, or preview the file from its repository page.');
      state.items = items.sort((a, b) => {
        if (a.type === 'dir' && b.type !== 'dir') return -1;
        if (b.type === 'dir' && a.type !== 'dir') return 1;
        return a.name.localeCompare(b.name);
      });
      renderBreadcrumb();
      renderFileList(state.items);
      setAPIStatus('LIVE');
      if (!state.items.length) {
        byId('file-list').innerHTML = '<div class="empty-state"><span>∅</span><p>This folder is empty.</p></div>';
      }
    } catch (error) {
      byId('file-list').innerHTML = '<div class="empty-state"><span>!</span><p>' + escapeHTML(error.message) + '</p><button type="button" id="retry-path">Try again</button></div>';
      byId('file-count').textContent = 'UNAVAILABLE';
      setAPIStatus('RETRY NEEDED', 'error');
    }
  }

  function decodeBase64Utf8(value) {
    const binary = atob(value.replace(/\s/g, ''));
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  }

  async function getFileText(item) {
    if (state.previewCache.has(item.url)) return state.previewCache.get(item.url);
    const result = await githubFetch(item.url);
    if (result.encoding === 'base64' && result.content) {
      const content = decodeBase64Utf8(result.content);
      state.previewCache.set(item.url, content);
      return content;
    }
    if (result.download_url) {
      const response = await fetch(result.download_url);
      if (response.ok) {
        const content = await response.text();
        state.previewCache.set(item.url, content);
        return content;
      }
    }
    throw new Error('GitHub did not provide a text preview for this file.');
  }

  function isLikelyText(item) {
    const extension = (item.name.split('.').pop() || '').toLowerCase();
    return new Set(['md','markdown','html','htm','css','scss','js','mjs','cjs','ts','tsx','jsx','json','xml','kt','java','py','yml','yaml','txt','sh','bash','gradle','kts','properties','sql','toml','ini','gitignore','dockerfile','svg','env.example','log','csv','c','h','cpp','hpp','go','rs','swift','dart']).has(extension) || ['README','LICENSE','Dockerfile','Makefile'].includes(item.name);
  }

  function drawPreview(item, text) {
    const target = byId('file-preview');
    const link = repoFileURL(state.repo, item.path);
    const lines = text.split('\n').slice(0, 150);
    const truncated = text.split('\n').length > 150;
    const code = lines.map(line => '<span class="code-line">' + escapeHTML(line) + '</span>').join('');
    target.innerHTML = '<div class="preview-file-head"><span class="preview-file-name">' + escapeHTML(item.path) + '</span><a href="' + escapeHTML(link) + '" target="_blank" rel="noreferrer">Open ↗</a></div>' +
      '<div class="preview-file-body"><pre class="preview-code">' + code + '</pre></div>' +
      '<div class="preview-footer"><span>' + (truncated ? 'First 150 lines shown' : lines.length + ' lines') + '</span><a href="#" id="show-full-source">Expand preview ↗</a></div>';
    byId('show-full-source').addEventListener('click', (event) => {
      event.preventDefault();
      const dialog = byId('source-dialog');
      byId('dialog-title').textContent = item.name;
      byId('dialog-meta').textContent = state.repo.name + ' / ' + item.path;
      byId('source-code').textContent = text;
      byId('dialog-github-link').href = link;
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else window.open(link, '_blank', 'noopener');
    });
  }

  async function selectFile(item) {
    state.selectedPath = item.path;
    renderFileList(state.items);
    const target = byId('file-preview');
    target.innerHTML = '<div class="empty-state"><span class="loading-spinner"></span><p>Reading ' + escapeHTML(item.name) + '…</p></div>';
    if (!isLikelyText(item)) {
      const link = repoFileURL(state.repo, item.path);
      target.innerHTML = '<div class="preview-empty"><div class="preview-glyph">' + escapeHTML(iconFor(item)) + '</div><span class="case-overline">NON-TEXT FILE</span><h3>' + escapeHTML(item.name) + '</h3><p>This file is stored in the repository but is not shown as text here. Open it on GitHub to inspect or download it.</p><a class="text-link" href="' + escapeHTML(link) + '" target="_blank" rel="noreferrer">Open original file ↗</a></div>';
      return;
    }
    try {
      const text = await getFileText(item);
      drawPreview(item, text);
    } catch (error) {
      target.innerHTML = '<div class="preview-empty"><div class="preview-glyph">!</div><span class="case-overline">PREVIEW UNAVAILABLE</span><h3>Open the original.</h3><p>' + escapeHTML(error.message) + '</p><a class="text-link" href="' + escapeHTML(repoFileURL(state.repo, item.path)) + '" target="_blank" rel="noreferrer">View on GitHub ↗</a></div>';
    }
  }

  function observeReveals() {
    const elements = document.querySelectorAll('.reveal:not(.is-visible)');
    if (!('IntersectionObserver' in window)) {
      elements.forEach(element => element.classList.add('is-visible'));
      return;
    }
    if (!state.revealObserver) {
      state.revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    }
    elements.forEach(element => state.revealObserver.observe(element));
  }

  async function boot() {
    byId('year').textContent = new Date().getFullYear();
    observeReveals();
    window.addEventListener('scroll', () => {
      const pageHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percent = pageHeight > 0 ? (window.scrollY / pageHeight) * 100 : 0;
      byId('scroll-progress').style.width = Math.min(100, Math.max(0, percent)) + '%';
    }, { passive: true });

    const menu = byId('menu-toggle');
    menu.addEventListener('click', () => {
      const nav = byId('main-nav');
      const isOpen = nav.classList.toggle('is-open');
      menu.setAttribute('aria-expanded', String(isOpen));
      menu.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
    });
    byId('main-nav').querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      byId('main-nav').classList.remove('is-open');
      menu.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-label', 'Open navigation');
    }));

    byId('repo-select').addEventListener('change', event => setCurrentRepo(event.target.value));
    byId('file-search').addEventListener('input', () => renderFileList(state.items));
    byId('file-list').addEventListener('click', event => {
      const retry = event.target.closest('#retry-path');
      if (retry) { loadPath(state.path); return; }
      const row = event.target.closest('.file-row');
      if (!row) return;
      const item = state.items.find(candidate => candidate.path === row.dataset.path);
      if (!item) return;
      if (item.type === 'dir') loadPath(item.path);
      else selectFile(item);
    });
    byId('breadcrumb').addEventListener('click', event => {
      const button = event.target.closest('[data-breadcrumb-depth]');
      if (!button) return;
      const depth = Number(button.dataset.breadcrumbDepth);
      const parts = state.path.split('/').filter(Boolean).slice(0, depth);
      loadPath(parts.join('/'));
    });
    byId('repo-open').addEventListener('click', () => {});
    byId('dialog-close').addEventListener('click', () => byId('source-dialog').close());
    byId('source-dialog').addEventListener('click', event => {
      if (event.target === byId('source-dialog')) byId('source-dialog').close();
    });

    try {
      const [repos, profile] = await Promise.all([
        githubFetch(API + '/users/' + USER + '/repos?per_page=100&sort=updated&type=owner'),
        githubFetch(API + '/users/' + USER)
      ]);
      state.repos = repos.filter(repo => !repo.private);
      renderStats(state.repos, profile);
      renderRepoWall(state.repos);
      populateRepoSelect(state.repos);
      setAPIStatus('LIVE');
      byId('api-note').textContent = 'Live from GitHub. Public repository names, descriptions, language labels, folder listings, and file previews are requested when this page is used.';
    } catch (error) {
      setAPIStatus('OFFLINE', 'error');
      byId('repo-stat').textContent = '—';
      byId('followers-stat').textContent = '—';
      byId('latest-stat').textContent = '—';
      byId('latest-repo').textContent = 'Could not reach GitHub API';
      byId('live-repo-grid').innerHTML = '<div class="repo-loading glass-panel">' + escapeHTML(error.message) + ' <a href="https://github.com/' + USER + '?tab=repositories">Open GitHub ↗</a></div>';
      byId('repo-select').innerHTML = '<option value="">GitHub data unavailable</option>';
      byId('file-list').innerHTML = '<div class="empty-state"><span>!</span><p>The live repository explorer could not connect. You can still browse the source directly on GitHub.</p><a class="text-link" href="https://github.com/' + USER + '?tab=repositories" target="_blank" rel="noreferrer">Open all repositories ↗</a><button type="button" id="retry-bootstrap">Retry connection</button></div>';
      byId('file-list').addEventListener('click', async event => {
        if (event.target.closest('#retry-bootstrap')) {
          byId('file-list').innerHTML = '<div class="empty-state"><span class="loading-spinner"></span><p>Retrying GitHub connection…</p></div>';
          await bootRepositoryOnly();
        }
      });
    }
  }

  async function bootRepositoryOnly() {
    try {
      const [repos, profile] = await Promise.all([
        githubFetch(API + '/users/' + USER + '/repos?per_page=100&sort=updated&type=owner'),
        githubFetch(API + '/users/' + USER)
      ]);
      state.repos = repos.filter(repo => !repo.private);
      renderStats(state.repos, profile);
      renderRepoWall(state.repos);
      populateRepoSelect(state.repos);
      setAPIStatus('LIVE');
    } catch (error) {
      byId('file-list').innerHTML = '<div class="empty-state"><p>' + escapeHTML(error.message) + '</p><button type="button" id="retry-bootstrap">Try again</button></div>';
    }
  }

  document.addEventListener('DOMContentLoaded', boot);
})();