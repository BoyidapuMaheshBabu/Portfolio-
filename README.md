# Mahesh Babu — Portfolio

> **Understand → Build → Test → Improve**

A responsive, glassmorphism portfolio that presents my project work, learning process, and public GitHub repositories. Built as a lightweight static website with live GitHub data—no frontend framework or build step required.

**Repository:** [BoyidapuMaheshBabu/Portfolio-](https://github.com/BoyidapuMaheshBabu/Portfolio-)

## ✨ What is inside

- **Editorial hero and glass UI** — layered gradients, glass panels, fine grid texture, animated details, and a consistent visual system.
- **Project case studies** — TermRunway Android, RESUP, Problem-Solving-Logic, Jujutsu Kaisen Explorer, and the earlier TermRunway web prototype.
- **Live GitHub overview** — repository count, followers, latest push, and cards sourced from GitHub's public API.
- **Repository explorer** — select a public repository, navigate folders, search within the current folder, preview text files, and open the original file on GitHub.
- **Responsive by design** — mobile navigation, stacked layouts, keyboard-focus styling, and reduced-motion support.
- **Accessible, dependency-light code** — semantic HTML, plain CSS, and vanilla JavaScript.
- **Automatic deployment workflow** — GitHub Actions prepares the website and publishes it to GitHub Pages.

## 🧰 Stack

| Area | Implementation |
| --- | --- |
| Structure | HTML5 |
| Design | CSS3, responsive grid/flex layouts, glassmorphism |
| Interaction | Vanilla JavaScript |
| Live data | GitHub REST API (public endpoints) |
| Hosting | GitHub Pages through GitHub Actions |
| Dependencies | No framework or package installation required |

## 📁 Project structure

```text
Portfolio-/
├── index.html
├── styles.css
├── script.js
├── favicon.svg
├── .github/
│   └── workflows/
│       └── deploy.yml
└── README.md
```

## 🚀 Run it locally

No package manager or build command is needed.

1. Clone the repository:

   ```bash
   git clone https://github.com/BoyidapuMaheshBabu/Portfolio-.git
   cd Portfolio-
   ```

2. Open `index.html` in a browser, or run a local static server. If Python is installed:

   ```bash
   python -m http.server 8000
   ```

3. Visit `http://localhost:8000`.

The repository explorer needs an internet connection to reach GitHub's public API. The rest of the page is built from the repository's own HTML, CSS, and JavaScript files.

## 🌐 Publish with GitHub Pages

The included workflow publishes the site whenever `index.html`, `styles.css`, `script.js`, `favicon.svg`, or the workflow itself changes on `main`.

1. Open this repository's **Settings → Pages**.
2. Under **Build and deployment**, choose **GitHub Actions** as the source.
3. Open the **Actions** tab and check **Deploy portfolio to GitHub Pages**. If it has not run, use **Run workflow** or make a website-file commit to `main`.
4. Once the deployment finishes successfully, open the website URL shown by the workflow. For this repository, the expected project-site URL is:

   `https://boyidapumaheshbabu.github.io/Portfolio-/`

GitHub may take a little time to publish the first deployment. The Actions run is the source of truth for whether deployment succeeded.

## 🔌 How the live GitHub explorer works

The site requests public repository and profile data from GitHub's REST API in the browser. When a visitor selects a repository or opens a folder, the explorer requests that path. Text previews are read-only, and links lead to the original GitHub file.

A public unauthenticated GitHub API has rate limits. If many visitors use the explorer in a short period, data may temporarily stop loading; the page then links visitors back to GitHub. No token or secret is stored in the browser, and no private repositories are requested.

## 🧭 Content & accuracy

This portfolio intentionally distinguishes between active product work, prototypes, historical projects, and programming practice. It does not claim professional experience or expert proficiency. Some projects used AI-assisted implementation; the project descriptions explain their actual status and learning purpose.

When changing the portfolio, keep the project status, technologies, links, and descriptions consistent with the corresponding repositories.

---

**Built to make the process visible—not just the finished screen.**
