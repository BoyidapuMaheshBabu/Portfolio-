(() => {
  'use strict';

  const USER = 'BoyidapuMaheshBabu';
  const API = 'https://api.github.com';
  const CURATED = new Set(['TermRunway-Android', 'RESUP', 'Problem-Solving-Logic', 'jjk', 'TermRunway-Web']);
  const byId = (id) => document.getElementById(id);
  const $ = (selector, root = document) => root.querySelector(selector);
  const state = {
    repos: [], repo: null, path: '', items: [], selectedPath: '',
    apiCalls: 0,
    previewCache: new Map(),
    revealObserver: null,
    pathRequestId: 0,
    previewRequestId: 0,
    bootstrapRequestId: 0,
    pathController: null,
    previewController: null,
    bootstrapController: null
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

  async function githubFetch(url, options = {}) {
    state.apiCalls += 1;
    let response;
    try {
      response = await fetch(url, {
        headers: { Accept: 'application/vnd.github+json' },
        cache: 'default',
        signal: options.signal
      });
    } catch (error) {
      if (error && error.name === 'AbortError') throw error;
      throw new Error('Could not connect to GitHub. Check your internet connection and retry.');
    }

    if (!response.ok) {
      const remaining = response.headers.get('X-RateLimit-Remaining');
      if (response.status === 429 || (response.status === 403 && remaining === '0')) {
        throw new Error('GitHub’s public API rate limit has been reached. Wait a little, then retry.');
      }
      if (response.status === 404) {
        throw new Error('This repository path is not available. It may have been moved or removed.');
      }
      if (response.status === 409 || response.status === 422) {
        throw new Error('GitHub could not read this folder right now. Try the repository root.');
      }
      if (response.status >= 500) {
        throw new Error('GitHub is temporarily unavailable (' + response.status + '). Please retry shortly.');
      }
      throw new Error('GitHub responded with ' + response.status + '. Please try again shortly.');
    }

    try {
      return await response.json();
    } catch (error) {
      throw new Error('GitHub returned an unreadable response. Please retry.');
    }
  }

  async function fetchPublicRepos(signal) {
    const collected = [];
    for (let page = 1; page <= 100; page += 1) {
      const url = API + '/users/' + USER + '/repos?per_page=100&sort=updated&type=owner&page=' + page;
      const batch = await githubFetch(url, { signal });
      if (!Array.isArray(batch)) throw new Error('GitHub returned an unexpected repository list.');
      collected.push(...batch.filter(repo => !repo.private));
      if (batch.length < 100) return collected;
    }
    throw new Error('The repository list is unusually large. Open GitHub directly to browse the full collection.');
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
      wall.innerHTML = '<div class="repo-loading glass-panel">' +
        (repos.length
          ? 'The featured projects above cover the public repositories currently available.'
          : 'GitHub did not return any public repositories for this account.') +
        '</div>';
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

  async function populateRepoSelect(repos) {
    const select = byId('repo-select');
    const sorted = [...repos].sort((a, b) => {
      const curatedRank = (name) => ({
        'TermRunway-Android': 0, RESUP: 1, 'Problem-Solving-Logic': 2,
        jjk: 3, 'TermRunway-Web': 4
      }[name] ?? 10);
      return curatedRank(a.name) - curatedRank(b.name) || a.name.localeCompare(b.name);
    });

    if (!sorted.length) {
      select.innerHTML = '<option value="">No public repositories found</option>';
      byId('repo-open').href = 'https://github.com/' + USER + '?tab=repositories';
      byId('file-count').textContent = '0 ITEMS';
      byId('file-list').innerHTML = '<div class="empty-state"><span>∅</span><p>No public repositories were returned by GitHub.</p></div>';
      byId('breadcrumb').innerHTML = '<span class="crumb-current">/</span><span class="breadcrumb-hint">No repository selected</span>';
      renderRepoDetails(null);
      setAPIStatus('LIVE');
      return;
    }

    select.innerHTML = sorted.map(repo =>
      '<option value="' + escapeHTML(repo.name) + '">' + escapeHTML(repo.name) + '</option>'
    ).join('');
    const preferred = sorted.find(repo => repo.name === 'TermRunway-Android') ||
      sorted.find(repo => repo.name !== 'Portfolio-') || sorted[0];
    select.value = preferred.name;
    await setCurrentRepo(preferred.name);
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

  function ensureRepoDetailsPanel() {
    let panel = byId('repo-detail');
    if (panel) return panel;
    const toolbar = $('.lab-toolbar');
    if (!toolbar) return null;
    panel = document.createElement('section');
    panel.className = 'repo-detail';
    panel.id = 'repo-detail';
    panel.setAttribute('aria-label', 'Selected repository metadata');
    panel.setAttribute('aria-live', 'polite');
    toolbar.insertAdjacentElement('afterend', panel);
    return panel;
  }

  function renderRepoDetails(repo) {
    const panel = ensureRepoDetailsPanel();
    if (!panel) return;
    if (!repo) {
      panel.innerHTML = '<p class="repo-detail-empty">Select a public repository to see its metadata.</p>';
      return;
    }
    const metrics = [
      ['Stars', formatNumber(repo.stargazers_count || 0)],
      ['Forks', formatNumber(repo.forks_count || 0)],
      ['Default branch', repo.default_branch || 'main'],
      ['Last push', formatDate(repo.pushed_at)]
    ];
    panel.innerHTML =
      '<div class="repo-detail-copy">' +
        '<div class="repo-detail-title"><strong>' + escapeHTML(repo.full_name || (USER + '/' + repo.name)) + '</strong>' +
          '<span class="repo-detail-badge">' + (repo.fork ? 'FORK' : 'PUBLIC') + '</span></div>' +
        '<p>' + escapeHTML(repo.description || 'No description has been added to this repository.') + '</p>' +
        (repo.language ? '<span class="repo-detail-language">' + escapeHTML(repo.language) + '</span>' : '') +
      '</div>' +
      '<div class="repo-detail-metrics">' +
        metrics.map(([label, value]) =>
          '<span><small>' + escapeHTML(label) + '</small><b>' + escapeHTML(value) + '</b></span>'
        ).join('') +
      '</div>';
  }
  async function setCurrentRepo(name) {
    const repo = state.repos.find(item => item.name === name);
    if (!repo) return;

    state.pathController?.abort();
    state.previewController?.abort();
    state.pathRequestId += 1;
    state.previewRequestId += 1;
    state.repo = repo;
    state.path = '';
    state.items = [];
    state.selectedPath = '';
    byId('repo-open').href = repo.html_url;
    byId('file-search').value = '';
    renderRepoDetails(repo);
    renderBreadcrumb();
    showEmptyPreview();
    await loadPath('');
  }
  async function loadPath(path) {
    if (!state.repo) return;
    const repo = state.repo;
    const requestId = ++state.pathRequestId;

    state.pathController?.abort();
    state.previewController?.abort();
    state.previewRequestId += 1;
    const controller = new AbortController();
    state.pathController = controller;

    state.path = path;
    state.selectedPath = '';
    renderBreadcrumb();
    byId('file-list').innerHTML = '<div class="empty-state"><span class="loading-spinner"></span><p>Loading this folder from GitHub…</p></div>';
    byId('file-count').textContent = 'LOADING';
    showEmptyPreview();

    const url = API + '/repos/' + USER + '/' + encodeURIComponent(repo.name) + '/contents' +
      (path ? '/' + path.split('/').map(encodeURIComponent).join('/') : '') +
      '?ref=' + encodeURIComponent(repo.default_branch || 'main');

    try {
      const items = await githubFetch(url, { signal: controller.signal });
      if (requestId !== state.pathRequestId || state.repo?.name !== repo.name) return;
      if (!Array.isArray(items)) {
        throw new Error('This path is a file. Select a folder to browse, or open the file from its repository page.');
      }
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
      if ((error && error.name === 'AbortError') || requestId !== state.pathRequestId) return;
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

  async function getFileText(item, signal) {
    if (state.previewCache.has(item.url)) return state.previewCache.get(item.url);
    const result = await githubFetch(item.url, { signal });
    if (result.encoding === 'base64' && result.content) {
      const content = decodeBase64Utf8(result.content);
      state.previewCache.set(item.url, content);
      return content;
    }
    if (result.download_url) {
      let response;
      try {
        response = await fetch(result.download_url, { signal });
      } catch (error) {
        if (error && error.name === 'AbortError') throw error;
        throw new Error('Could not download the file preview. Check your connection and retry.');
      }
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
    const allLines = text.split('\n');
    const lines = allLines.slice(0, 150);
    const truncated = allLines.length > 150;
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
    const requestId = ++state.previewRequestId;
    const repoName = state.repo?.name;
    state.previewController?.abort();
    const controller = new AbortController();
    state.previewController = controller;

    state.selectedPath = item.path;
    renderFileList(state.items);
    const target = byId('file-preview');
    target.innerHTML = '<div class="empty-state"><span class="loading-spinner"></span><p>Reading ' + escapeHTML(item.name) + '…</p></div>';

    if (!isLikelyText(item)) {
      if (requestId !== state.previewRequestId || state.repo?.name !== repoName) return;
      const link = repoFileURL(state.repo, item.path);
      target.innerHTML = '<div class="preview-empty"><div class="preview-glyph">' + escapeHTML(iconFor(item)) + '</div><span class="case-overline">NON-TEXT FILE</span><h3>' + escapeHTML(item.name) + '</h3><p>This file is stored in the repository but is not shown as text here. Open it on GitHub to inspect or download it.</p><a class="text-link" href="' + escapeHTML(link) + '" target="_blank" rel="noopener noreferrer">Open original file ↗</a></div>';
      return;
    }

    try {
      const text = await getFileText(item, controller.signal);
      if (requestId !== state.previewRequestId || state.repo?.name !== repoName || state.selectedPath !== item.path) return;
      drawPreview(item, text);
    } catch (error) {
      if ((error && error.name === 'AbortError') || requestId !== state.previewRequestId) return;
      target.innerHTML = '<div class="preview-empty"><div class="preview-glyph">!</div><span class="case-overline">PREVIEW UNAVAILABLE</span><h3>Open the original.</h3><p>' + escapeHTML(error.message) + '</p><a class="text-link" href="' + escapeHTML(repoFileURL(state.repo, item.path)) + '" target="_blank" rel="noopener noreferrer">View on GitHub ↗</a></div>';
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

  async function loadAccountData() {
    const requestId = ++state.bootstrapRequestId;
    state.bootstrapController?.abort();
    const controller = new AbortController();
    state.bootstrapController = controller;
    setAPIStatus('CONNECTING');
    byId('file-list').innerHTML = '<div class="empty-state"><span class="loading-spinner"></span><p>Connecting to GitHub…</p></div>';
    byId('file-count').textContent = 'LOADING';

    try {
      const [repos, profile] = await Promise.all([
        fetchPublicRepos(controller.signal),
        githubFetch(API + '/users/' + USER, { signal: controller.signal })
      ]);
      if (requestId !== state.bootstrapRequestId) return;
      state.repos = repos.filter(repo => !repo.private);
      renderStats(state.repos, profile);
      renderRepoWall(state.repos);
      await populateRepoSelect(state.repos);
      if (requestId !== state.bootstrapRequestId) return;
      byId('api-note').textContent = 'Live from GitHub. Repository metadata, folder listings, and read-only text previews are loaded from public API responses.';
    } catch (error) {
      if ((error && error.name === 'AbortError') || requestId !== state.bootstrapRequestId) return;
      setAPIStatus('OFFLINE', 'error');
      byId('repo-stat').textContent = '—';
      byId('followers-stat').textContent = '—';
      byId('latest-stat').textContent = '—';
      byId('latest-repo').textContent = 'Could not reach GitHub API';
      byId('live-repo-grid').innerHTML =
        '<div class="repo-loading glass-panel">' + escapeHTML(error.message) +
        ' <a href="https://github.com/' + USER + '?tab=repositories" target="_blank" rel="noopener noreferrer">Open GitHub ↗</a></div>';
      byId('repo-select').innerHTML = '<option value="">GitHub data unavailable</option>';
      byId('repo-open').href = 'https://github.com/' + USER + '?tab=repositories';
      byId('breadcrumb').innerHTML = '<span class="crumb-current">/</span><span class="breadcrumb-hint">Waiting for GitHub</span>';
      byId('file-count').textContent = 'UNAVAILABLE';
      byId('file-list').innerHTML =
        '<div class="empty-state"><span>!</span><p>' + escapeHTML(error.message) +
        '</p><p>The repository list could not be loaded. Check your connection or GitHub’s public API limit, then retry.</p>' +
        '<a class="text-link" href="https://github.com/' + USER + '?tab=repositories" target="_blank" rel="noopener noreferrer">Open all repositories ↗</a>' +
        '<button type="button" id="retry-bootstrap">Retry connection</button></div>';
      byId('api-note').textContent = 'The GitHub API could not be reached. The rest of this portfolio remains available.';
      renderRepoDetails(null);
      showEmptyPreview();
    }
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
      const bootstrapRetry = event.target.closest('#retry-bootstrap');
      if (bootstrapRetry) { loadAccountData(); return; }
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
    byId('dialog-close').addEventListener('click', () => {
      const dialog = byId('source-dialog');
      if (typeof dialog.close === 'function') dialog.close();
    });
    byId('source-dialog').addEventListener('click', event => {
      if (event.target === byId('source-dialog') && typeof byId('source-dialog').close === 'function') {
        byId('source-dialog').close();
      }
    });

    await loadAccountData();
  }
  document.addEventListener('DOMContentLoaded', boot);
})();