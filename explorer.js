/**
 * Interactive GitHub Repository Explorer
 * Target Account: BoyidapuMaheshBabu
 * Pure vanilla ES6 implementation without external build steps.
 */

const GitHubExplorer = (() => {
  const GITHUB_USERNAME = 'BoyidapuMaheshBabu';
  const API_BASE = 'https://api.github.com';

  // State Management
  let state = {
    repositories: [],
    selectedRepo: null,
    currentPath: '',
    currentContents: [],
    filteredContents: [],
    selectedFile: null,
    authToken: sessionStorage.getItem('gh_explorer_token') || '',
    rateLimitRemaining: null
  };

  // DOM Elements cache
  let dom = {};

  function init() {
    cacheDom();
    bindEvents();
    loadRepositories();
  }

  function cacheDom() {
    dom.repoSelect = document.getElementById('repo-select');
    dom.explorerMeta = document.getElementById('explorer-meta');
    dom.breadcrumbs = document.getElementById('breadcrumbs');
    dom.fileSearch = document.getElementById('file-search');
    dom.fileList = document.getElementById('file-list');
    dom.treeStatus = document.getElementById('tree-status');
    dom.previewFilename = document.getElementById('preview-filename');
    dom.previewStatus = document.getElementById('preview-status');
    dom.previewCodeContainer = document.getElementById('preview-code-container');
    dom.previewCode = document.getElementById('preview-code');
    dom.copyFileBtn = document.getElementById('copy-file-btn');
    dom.externalLink = document.getElementById('external-link');
    dom.toggleTokenBtn = document.getElementById('toggle-token-btn');
    dom.tokenDrawer = document.getElementById('token-drawer');
    dom.customTokenInput = document.getElementById('custom-token');
    dom.saveTokenBtn = document.getElementById('save-token-btn');
    dom.clearTokenBtn = document.getElementById('clear-token-btn');

    if (state.authToken && dom.customTokenInput) {
      dom.customTokenInput.value = '••••••••••••••••';
    }
  }

  function bindEvents() {
    dom.repoSelect.addEventListener('change', (e) => {
      const repoName = e.target.value;
      if (repoName) {
        selectRepository(repoName);
      }
    });

    dom.fileSearch.addEventListener('input', (e) => {
      filterContents(e.target.value.trim());
    });

    dom.copyFileBtn.addEventListener('click', copyFileContent);

    dom.toggleTokenBtn.addEventListener('click', () => {
      dom.tokenDrawer.classList.toggle('hidden');
    });

    dom.saveTokenBtn.addEventListener('click', () => {
      const token = dom.customTokenInput.value.trim();
      if (token && !token.includes('•')) {
        sessionStorage.setItem('gh_explorer_token', token);
        state.authToken = token;
        alert('GitHub Token applied to active session.');
      }
    });

    dom.clearTokenBtn.addEventListener('click', () => {
      sessionStorage.removeItem('gh_explorer_token');
      state.authToken = '';
      dom.customTokenInput.value = '';
      alert('Token removed.');
    });
  }

  async function apiFetch(endpoint) {
    const headers = {
      'Accept': 'application/vnd.github.v3+json'
    };

    if (state.authToken) {
      headers['Authorization'] = `token ${state.authToken}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, { headers });
    
    // Inspect remaining quota
    const remaining = response.headers.get('x-ratelimit-remaining');
    if (remaining !== null) {
      state.rateLimitRemaining = remaining;
      updateRateLimitBadge();
    }

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('GitHub API rate limit reached (60 req/hr). Add a Personal Access Token in API Settings.');
      }
      if (response.status === 404) {
        throw new Error('Resource not found or repository is private.');
      }
      throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  function updateRateLimitBadge() {
    let badge = document.getElementById('ratelimit-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.id = 'ratelimit-badge';
      badge.className = 'meta-item';
      dom.explorerMeta.appendChild(badge);
    }
    badge.innerHTML = `&#9889; Limit: <strong>${state.rateLimitRemaining}</strong> left`;
  }

  // --- Step 1: Repositories ---
  async function loadRepositories() {
    dom.repoSelect.innerHTML = '<option value="">Fetching repositories...</option>';
    try {
      const repos = await apiFetch(`/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`);
      state.repositories = Array.isArray(repos) ? repos : [];

      if (state.repositories.length === 0) {
        dom.repoSelect.innerHTML = '<option value="">No public repositories found</option>';
        return;
      }

      dom.repoSelect.innerHTML = state.repositories
        .map(r => `<option value="${r.name}">${r.name} ${r.fork ? '(Fork)' : ''}</option>`)
        .join('');

      // Auto-select first repo or Portfolio-
      const defaultRepo = state.repositories.find(r => r.name.toLowerCase().includes('portfolio')) || state.repositories[0];
      dom.repoSelect.value = defaultRepo.name;
      selectRepository(defaultRepo.name);
    } catch (err) {
      dom.repoSelect.innerHTML = '<option value="">Failed to load repositories</option>';
      showTreeStatus(`Error: ${err.message}`, true, () => loadRepositories());
    }
  }

  function selectRepository(repoName) {
    const repo = state.repositories.find(r => r.name === repoName);
    if (!repo) return;

    state.selectedRepo = repo;
    state.currentPath = '';
    renderRepoMetadata(repo);
    fetchDirectoryContents('');
  }

  function renderRepoMetadata(repo) {
    dom.explorerMeta.innerHTML = `
      <span class="meta-item">&#9733; ${repo.stargazers_count || 0}</span>
      <span class="meta-item">&#127860; ${repo.forks_count || 0}</span>
      <span class="meta-item">${repo.language || 'Plain'}</span>
    `;
    if (state.rateLimitRemaining !== null) {
      updateRateLimitBadge();
    }
  }

  // --- Step 2: Directory Browsing & Breadcrumbs ---
  async function fetchDirectoryContents(path) {
    state.currentPath = path;
    renderBreadcrumbs();
    showTreeStatus('Loading files...', false);
    dom.fileList.innerHTML = '';
    clearPreview();

    try {
      const endpoint = `/repos/${GITHUB_USERNAME}/${state.selectedRepo.name}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`;
      const items = await apiFetch(endpoint);

      if (!Array.isArray(items)) {
        showTreeStatus('Path did not resolve to a directory.', true);
        return;
      }

      // Sort: Folders first, then alphabetically
      state.currentContents = items.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'dir' ? -1 : 1;
      });

      state.filteredContents = [...state.currentContents];
      hideTreeStatus();
      renderFileList();
    } catch (err) {
      showTreeStatus(`Unable to load directory: ${err.message}`, true, () => fetchDirectoryContents(path));
    }
  }

  function renderBreadcrumbs() {
    const parts = state.currentPath ? state.currentPath.split('/').filter(Boolean) : [];
    let html = `<span class="breadcrumb-crumb" data-path="">root</span>`;
    let accumulatedPath = '';

    parts.forEach((segment, idx) => {
      accumulatedPath += (idx === 0 ? '' : '/') + segment;
      html += ` <span class="breadcrumb-separator">/</span> `;
      if (idx === parts.length - 1) {
        html += `<span class="breadcrumb-current">${escapeHtml(segment)}</span>`;
      } else {
        html += `<span class="breadcrumb-crumb" data-path="${escapeHtml(accumulatedPath)}">${escapeHtml(segment)}</span>`;
      }
    });

    dom.breadcrumbs.innerHTML = html;

    dom.breadcrumbs.querySelectorAll('.breadcrumb-crumb').forEach(el => {
      el.addEventListener('click', () => {
        const targetPath = el.getAttribute('data-path');
        fetchDirectoryContents(targetPath);
      });
    });
  }

  function filterContents(query) {
    if (!query) {
      state.filteredContents = [...state.currentContents];
    } else {
      const q = query.toLowerCase();
      state.filteredContents = state.currentContents.filter(item => 
        item.name.toLowerCase().includes(q)
      );
    }
    renderFileList();
  }

  function renderFileList() {
    if (state.filteredContents.length === 0) {
      dom.fileList.innerHTML = '<li class="panel-status">No matching files found.</li>';
      return;
    }

    dom.fileList.innerHTML = state.filteredContents.map(item => {
      const isDir = item.type === 'dir';
      const icon = isDir ? '&#128193;' : getFileIcon(item.name);
      return `
        <li class="file-item" data-path="${escapeHtml(item.path)}" data-type="${item.type}" data-name="${escapeHtml(item.name)}">
          <span class="item-icon">${icon}</span>
          <span class="item-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
        </li>
      `;
    }).join('');

    dom.fileList.querySelectorAll('.file-item').forEach(el => {
      el.addEventListener('click', () => {
        const type = el.getAttribute('data-type');
        const path = el.getAttribute('data-path');
        const name = el.getAttribute('data-name');

        if (type === 'dir') {
          fetchDirectoryContents(path);
        } else {
          // Highlight active item
          dom.fileList.querySelectorAll('.file-item').forEach(i => i.classList.remove('active'));
          el.classList.add('active');
          fetchAndPreviewFile(path, name);
        }
      });
    });
  }

  function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
      case 'html': return '&#127760;';
      case 'css': return '&#127912;';
      case 'js':
      case 'ts': return '&#9889;';
      case 'json': return '&#12344;';
      case 'md': return '&#128221;';
      case 'py': return '&#128013;';
      case 'java': return '&#9749;';
      default: return '&#128196;';
    }
  }

  // --- Step 3: Secure File Content Previewing ---
  async function fetchAndPreviewFile(path, name) {
    dom.previewFilename.textContent = name;
    dom.previewStatus.textContent = 'Fetching file contents...';
    dom.previewStatus.classList.remove('hidden');
    dom.previewCodeContainer.classList.add('hidden');
    dom.copyFileBtn.classList.add('hidden');
    dom.externalLink.classList.add('hidden');

    try {
      const endpoint = `/repos/${GITHUB_USERNAME}/${state.selectedRepo.name}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`;
      const fileData = await apiFetch(endpoint);

      if (fileData.encoding === 'base64' && fileData.content) {
        const decodedText = decodeBase64Utf8(fileData.content);
        displayPreviewContent(decodedText, fileData.html_url);
      } else if (fileData.download_url) {
        // Fallback for large raw text files
        const rawRes = await fetch(fileData.download_url);
        const text = await rawRes.text();
        displayPreviewContent(text, fileData.html_url);
      } else {
        throw new Error('This file format cannot be previewed in the browser.');
      }
    } catch (err) {
      dom.previewStatus.textContent = `Error previewing file: ${err.message}`;
    }
  }

  function displayPreviewContent(textContent, githubUrl) {
    dom.previewStatus.classList.add('hidden');
    dom.previewCodeContainer.classList.remove('hidden');
    
    // Strict XSS Prevention: render via textContent only
    dom.previewCode.textContent = textContent;
    state.selectedFileContent = textContent;

    dom.copyFileBtn.classList.remove('hidden');
    dom.externalLink.classList.remove('hidden');
    dom.externalLink.href = githubUrl;
  }

  function clearPreview() {
    dom.previewFilename.textContent = 'Select a file to preview';
    dom.previewStatus.textContent = 'No file selected.';
    dom.previewStatus.classList.remove('hidden');
    dom.previewCodeContainer.classList.add('hidden');
    dom.copyFileBtn.classList.add('hidden');
    dom.externalLink.classList.add('hidden');
  }

  function copyFileContent() {
    if (!state.selectedFileContent) return;
    navigator.clipboard.writeText(state.selectedFileContent).then(() => {
      const originalText = dom.copyFileBtn.textContent;
      dom.copyFileBtn.textContent = 'Copied!';
      setTimeout(() => { dom.copyFileBtn.textContent = originalText; }, 2000);
    });
  }

  // --- Decoding & Utilities ---
  function decodeBase64Utf8(base64String) {
    try {
      const cleanBase64 = base64String.replace(/\s/g, '');
      const binaryString = atob(cleanBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new TextDecoder('utf-8').decode(bytes);
    } catch (e) {
      return atob(base64String.replace(/\s/g, ''));
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showTreeStatus(message, isError = false, retryCallback = null) {
    dom.treeStatus.classList.remove('hidden');
    dom.treeStatus.innerHTML = `<span>${escapeHtml(message)}</span>`;
    if (isError && retryCallback) {
      const retryBtn = document.createElement('button');
      retryBtn.className = 'btn btn-sm btn-secondary';
      retryBtn.style.marginTop = '0.5rem';
      retryBtn.textContent = 'Retry';
      retryBtn.onclick = retryCallback;
      dom.treeStatus.appendChild(document.createElement('br'));
      dom.treeStatus.appendChild(retryBtn);
    }
  }

  function hideTreeStatus() {
    dom.treeStatus.classList.add('hidden');
  }

  return { init };
})();

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', GitHubExplorer.init);