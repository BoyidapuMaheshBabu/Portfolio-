# Mahesh Babu — Portfolio

A responsive portfolio inspired by the supplied navy, indigo, and cyan reference, with project cards and an interactive GitHub repository explorer.

## Run locally

1. Pull branch `portfolio/reference-layout-refresh` in GitHub Desktop.
2. Open the repository folder in Visual Studio Code.
3. Open `index.html`, right-click, and choose **Open with Live Server**.
4. Keep an internet connection available for Google Fonts and GitHub's public API.

No package installation, build step, backend, or deployment is required.

## Features

- Responsive navigation and portfolio sections.
- Live public GitHub repository list and repository metadata.
- Folder browsing, breadcrumbs, current-folder filename search, text previews, copy action, and original GitHub links.
- File contents are displayed through `textContent`, not executed as HTML.
- Retry controls for directory and repository-list failures.

## Files

- `index.html`: portfolio structure and Explorer controls.
- `styles.css`: responsive dark navy theme with indigo/cyan accents.
- `app.js`: mobile navigation and active-section behavior.
- `explorer.js`: supplied GitHub Explorer implementation.

## Security and API limits

The supplied Explorer includes an optional token drawer. It stores a token in this tab's `sessionStorage`; do not enter a token on a shared device. Public unauthenticated API access is the recommended default for a portfolio, and GitHub's public API rate limits still apply. No credentials are committed to this repository.

## Manual testing

- [ ] Test the mobile menu and section navigation.
- [ ] Wait for GitHub repositories to load and switch repositories.
- [ ] Open nested folders and use breadcrumbs to return.
- [ ] Search filenames in the current directory.
- [ ] Preview a text file, copy it, and open the source on GitHub.
- [ ] Test network failure/retry and unsupported file types.
- [ ] Check the browser console for errors.

This repository is for local development and testing only. No deployment or hosting setup is required.
