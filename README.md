# Mahesh Babu — Portfolio

> **Understand → Build → Test → Improve**

A responsive, source-first portfolio about learning software engineering by investigating problems, building products, testing what works, and improving the implementation. It is a lightweight static website that loads public GitHub data directly in the browser.

**Repository:** [BoyidapuMaheshBabu/Portfolio-](https://github.com/BoyidapuMaheshBabu/Portfolio-)

## What is included

- **Project case studies** covering TermRunway Android, RESUP, Problem-Solving-Logic, and the earlier TermRunway web prototype.
- **Live GitHub overview** showing public repository count, profile followers, and latest repository push from GitHub API responses.
- **Interactive repository explorer** to switch between public repositories, navigate folders, use clickable breadcrumbs, search names in the current folder, preview text files, expand previews, and open the original GitHub file.
- **Responsive UI** with mobile navigation, keyboard focus states, reduced-motion support, and a read-only source dialog.
- **No framework or build step**: HTML, CSS, and browser JavaScript run as static files.

The portfolio aims to represent learning and project work honestly. It does not claim professional software-engineering experience or expertise that has not been established.

## Technology

| Area | Implementation |
| --- | --- |
| Structure | HTML5 |
| Styling | CSS3, responsive layouts, glassmorphism, reduced-motion rules |
| Interactions | Vanilla JavaScript |
| Live data | GitHub public REST API |
| Local development | Visual Studio Code + Live Server |
| Build tools | None required |

## Run locally with VS Code Live Server

No `npm install`, build command, API token, or environment file is required.

1. Clone or update the existing repository using **GitHub Desktop**.
2. In VS Code, open the `Portfolio-` project folder.
3. Install the **Live Server** extension if it is not already installed.
4. Open `index.html`, right-click in the editor, and choose **Open with Live Server**.
5. Test the site at the local address opened by the extension (usually `http://127.0.0.1:5500`).

Use Live Server rather than opening the HTML as a `file://` URL. The explorer needs an internet connection to contact GitHub's public API. Google Fonts also loads from the network; if that request is unavailable, the local font fallbacks are used.

## Interactive GitHub Explorer

The explorer requests data from GitHub's unauthenticated public API:

- Repository metadata comes from the public repository list; results are paginated so accounts with more than 100 public repositories are not silently reduced to the first page.
- Folder listings are requested from the selected repository's default branch.
- Breadcrumbs return to any ancestor folder, and filename search filters the currently loaded folder.
- Text previews display file content as escaped text. Repository file contents are never inserted as executable HTML.
- The expanded preview dialog is read-only and links to the original GitHub file. Binary and unsupported files link back to GitHub instead of being interpreted in the page.
- Loading and error states include retry actions. Request cancellation and request IDs prevent slower responses from a previous repository, folder, or file selection from overwriting the latest selection.

No GitHub token, secret, backend, database, or private repository access is used. The public API has unauthenticated rate limits; if a limit or connectivity error occurs, wait briefly or open the relevant repositories on GitHub and retry later.

## Optional local checks

The website itself needs only Live Server. If Node.js is installed, run these checks from the repository root:

```bash
node --check script.js
node tests/smoke-check.mjs
```

The smoke check validates local asset references, static DOM IDs used by JavaScript, key explorer safeguards, responsive/reduced-motion rules, and the absence of a repository deployment workflow. It does not replace interactive browser testing of GitHub API behavior.

## Project structure

```text
Portfolio-/
├── index.html
├── styles.css
├── script.js
├── favicon.svg
├── tests/
│   └── smoke-check.mjs
└── README.md
```

## Manual browser checklist

- [ ] Load the page at desktop and mobile widths; check the navigation menu and section links.
- [ ] Confirm repository totals and metadata load from GitHub.
- [ ] Switch repositories quickly and verify that the displayed files belong to the current selection.
- [ ] Open nested folders, return through breadcrumbs, and search filenames within a folder.
- [ ] Preview a text file, expand the preview, and open the original file on GitHub.
- [ ] Test a binary file, an empty/search-miss folder, and retry controls during a connection or API error.
- [ ] Check keyboard focus, dialog close behavior, and reduced-motion settings.

The website is intentionally **not configured to deploy or publish**. Use the local workflow above for development and testing.

---

**Built to make the process visible—not just the finished screen.**
