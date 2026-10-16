import { useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, ExternalLink, Code2, Sparkles, Menu, X, GitFork, Star, RefreshCw, Folder, FileCode2, ChevronRight, Terminal, Smartphone, BrainCircuit, CircleDot } from 'lucide-react';

function GitHubMark({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.08c-3.1.67-3.76-1.32-3.76-1.32-.5-1.29-1.23-1.63-1.23-1.63-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15.99 1.7 2.6 1.21 3.23.92.1-.72.39-1.21.7-1.49-2.48-.28-5.08-1.24-5.08-5.52 0-1.22.44-2.22 1.15-3-.11-.28-.5-1.42.11-2.96 0 0 .94-.3 3.05 1.14a10.6 10.6 0 0 1 5.55 0c2.12-1.44 3.05-1.14 3.05-1.14.61 1.54.23 2.68.12 2.96.71.78 1.14 1.78 1.14 3 0 4.29-2.6 5.23-5.09 5.51.4.35.75 1.03.75 2.08v3.08c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z" />
    </svg>
  );
}

const USER = 'BoyidapuMaheshBabu';
const FEATURED = [
  { name: 'TermRunway-Android', number: '01', type: 'PRODUCT / ANDROID', title: 'Money, with a plan.', description: 'An offline-first student finance tracker built around daily spending and semester planning.', stack: ['Android', 'Kotlin', 'Local-first'], icon: Smartphone, url: 'https://github.com/BoyidapuMaheshBabu/TermRunway-Android', color: 'violet' },
  { name: 'Problem-Solving-Logic', number: '02', type: 'LEARNING / ENGINEERING', title: 'Think in logic.', description: 'A growing record of programming exercises, experiments, and the reasoning behind each solution.', stack: ['Python', 'Problem solving', 'Git'], icon: BrainCircuit, url: 'https://github.com/BoyidapuMaheshBabu/Problem-Solving-Logic', color: 'mint' },
  { name: 'Portfolio-', number: '03', type: 'WEB / EXPERIMENT', title: 'Make the work visible.', description: 'This portfolio: a hands-on experiment in interface design, React, motion, and GitHub integration.', stack: ['React', 'Vite', 'React Bits-inspired motion'], icon: Code2, url: 'https://github.com/BoyidapuMaheshBabu/Portfolio-', color: 'blue' }
];

function Reveal({ children, className = '' }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = document.querySelectorAll('[data-reveal]');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: 0.12 });
    node.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return <div data-reveal className={className}>{children}</div>;
}

function decodeBase64Utf8(value) {
  const binary = atob(value.replace(/\s/g, ''));
  return new TextDecoder().decode(Uint8Array.from(binary, char => char.charCodeAt(0)));
}
function highlightLine(line) {
  const pattern = /(\/\/.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:const|let|var|function|return|if|else|async|await|try|catch|throw|new|class|import|from|export|default|true|false|null|undefined)\b|\b\d+(?:\.\d+)?\b)/g;
  const parts = []; let last = 0; let match;
  while ((match = pattern.exec(line)) !== null) {
    if (match.index > last) parts.push(line.slice(last, match.index));
    const token = match[0];
    const kind = token.startsWith('//') ? 'token-comment' : (token.startsWith('"') || token.startsWith("'")) ? 'token-string' : /^\d/.test(token) ? 'token-number' : 'token-keyword';
    parts.push(<span className={kind} key={match.index}>{token}</span>);
    last = match.index + token.length;
  }
  if (last < line.length) parts.push(line.slice(last));
  return parts.length ? parts : ' ';
}
function GitHubLab() {
  const [repos, setRepos] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [files, setFiles] = useState([]);
  const [path, setPath] = useState('');
  const [folderLoading, setFolderLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState('');
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copyLabel, setCopyLabel] = useState('Copy code');

  async function loadRepos() {
    setLoading(true); setError('');
    try {
      const [p,r] = await Promise.all([fetch('https://api.github.com/users/'+USER),fetch('https://api.github.com/users/'+USER+'/repos?per_page=100&sort=updated')]);
      if (!p.ok || !r.ok) throw new Error('GitHub is temporarily unavailable or its public API rate limit was reached.');
      const profileData=await p.json(), repoData=await r.json();
      setProfile(profileData);
      setRepos(repoData.filter(repo=>!repo.fork).sort((a,b)=>new Date(b.pushed_at)-new Date(a.pushed_at)));
    } catch(e) { setError(e.message||'Could not connect to GitHub.'); }
    finally { setLoading(false); }
  }
  useEffect(()=>{loadRepos();},[]);
  useEffect(()=>{if(!expanded)return;const onKeyDown=e=>{if(e.key==='Escape'){setExpanded(false);setOptionsOpen(false);}};window.addEventListener('keydown',onKeyDown);return()=>window.removeEventListener('keydown',onKeyDown);},[expanded]);
  const filtered=useMemo(()=>repos.filter(r=>r.name.toLowerCase().includes(query.toLowerCase())),[repos,query]);

  async function openRepo(repo,nextPath='') {
    setSelected(repo); setPath(nextPath); setFolderLoading(true); setFiles([]); setExpanded(false);
    setSelectedFile(null); setFileContent(''); setFileError(''); setOptionsOpen(false);
    try {
      const encodedPath=nextPath.split('/').map(encodeURIComponent).join('/');
      const response=await fetch('https://api.github.com/repos/'+USER+'/'+repo.name+'/contents/'+encodedPath);
      if(!response.ok) throw new Error('Unable to load this folder. Try again in a moment.');
      const data=await response.json(); setFiles(Array.isArray(data)?data:[]);
    } catch(e) { setFiles([{name:e.message,type:'message',path:''}]); }
    finally { setFolderLoading(false); }
  }
  async function openFile(item) {
    setSelectedFile(item); setFileContent(''); setFileError(''); setFileLoading(true); setOptionsOpen(false);
    try {
      const filePath=item.path.split('/').map(encodeURIComponent).join('/');
      const response=await fetch('https://api.github.com/repos/'+USER+'/'+selected.name+'/contents/'+filePath);
      if(!response.ok) throw new Error(response.status===403?'GitHub API rate limit reached. Try again later.':'Could not load this source file.');
      const data=await response.json();
      if(typeof data.content==='string' && data.content.trim()) setFileContent(data.encoding==='base64'?decodeBase64Utf8(data.content):data.content);
      else if(data.download_url) {
        const raw=await fetch(data.download_url);
        if(!raw.ok) throw new Error('Could not load the raw file. Open it directly on GitHub.');
        setFileContent(await raw.text());
      } else throw new Error('GitHub did not return readable text. Open this file on GitHub instead.');
    } catch(e) { setFileError(e.message||'Could not load this file.'); }
    finally { setFileLoading(false); }
  }
  async function copyCode() {
    try { await navigator.clipboard.writeText(fileContent); setCopyLabel('Copied!'); setOptionsOpen(false); window.setTimeout(()=>setCopyLabel('Copy code'),1600); }
    catch { setCopyLabel('Copy unavailable'); }
  }
  function downloadCode() {
    const url=URL.createObjectURL(new Blob([fileContent],{type:'text/plain;charset=utf-8'}));
    const anchor=document.createElement('a'); anchor.href=url; anchor.download=selectedFile?.name||'source.txt'; anchor.click(); URL.revokeObjectURL(url); setOptionsOpen(false);
  }
  return <div className="lab-shell">
    <div className="lab-topline"><span><span className="live-dot" /> LIVE PUBLIC DATA</span><span>GITHUB API / READ ONLY</span></div>
    <div className="lab-stats">
      <div><span className="stat-label">PUBLIC REPOSITORIES</span><strong>{loading?'—':repos.length}</strong></div>
      <div><span className="stat-label">FOLLOWERS</span><strong>{loading?'—':profile?.followers??'—'}</strong></div>
      <div><span className="stat-label">LATEST PUSH</span><strong className="stat-date">{loading?'Loading':repos[0]?new Date(repos[0].pushed_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—'}</strong></div>
    </div>
    <div className={'lab-browser '+(expanded?'viewer-expanded':'')}>
      <div className="lab-sidebar">
        <div className="lab-browser-title"><Terminal size={15}/><span>Repository explorer</span><button aria-label="Refresh repositories" onClick={loadRepos}><RefreshCw size={14}/></button></div>
        <label className="search-box"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find a repository..." /></label>
        {error&&<div className="lab-error">{error}<button onClick={loadRepos}>Retry</button></div>}
        <div className="repo-list">{loading?<p className="muted">Loading repositories…</p>:filtered.map(repo=><button key={repo.id} className={'repo-option '+(selected?.id===repo.id?'active':'')} onClick={()=>openRepo(repo)}><Folder size={14}/><span>{repo.name}</span><ChevronRight size={13}/></button>)}
          {!loading&&!error&&!filtered.length&&<p className="muted">No repositories match.</p>}
        </div>
        <a className="lab-profile-link" href="https://github.com/BoyidapuMaheshBabu" target="_blank" rel="noreferrer"><GitHubMark size={15}/> Open full GitHub profile <ArrowUpRight size={14}/></a>
      </div>
      <div className="lab-content">
        <div className="lab-content-head"><div><span className="micro-label">{selectedFile?'READ-ONLY SOURCE':'SOURCE EXPLORER'}</span><h3>{selectedFile?.name||selected?.name||'Choose a repository'}</h3></div>
          {selectedFile?<a href={selectedFile.html_url} target="_blank" rel="noreferrer" className="icon-link github-file-action" aria-label={'Open '+selectedFile.name+' on GitHub'} title="View this exact file on GitHub"><GitHubMark size={17}/></a>:selected&&<a href={selected.html_url} target="_blank" rel="noreferrer" className="icon-link" aria-label="Open repository on GitHub"><ExternalLink size={16}/></a>}
        </div>
        {selected&&<div className="breadcrumbs"><button onClick={()=>openRepo(selected,'')}>{selected.name}</button>{path&&path.split('/').map((part,i)=><span key={i}> / <button onClick={()=>openRepo(selected,path.split('/').slice(0,i+1).join('/'))}>{part}</button></span>)}{selectedFile&&<span> / <b>{selectedFile.name}</b></span>}</div>}
        {!selected&&<div className="lab-empty"><div className="empty-icon"><GitHubMark size={26}/></div><strong>Your work, directly from source.</strong><p>Select any public repository to browse its files and folders.</p></div>}
        {selected&&!selectedFile&&<div className="file-list">{folderLoading?<p className="muted">Loading files…</p>:files.map(item=><div key={item.path} className="file-row">{item.type==='dir'?<Folder size={15}/>:<FileCode2 size={15}/>}<button className="file-name-button" disabled={item.type==='message'} onClick={()=>item.type==='dir'?openRepo(selected,item.path):openFile(item)}>{item.name}</button>{item.type==='dir'&&<button onClick={()=>openRepo(selected,item.path)}>Open <ChevronRight size={13}/></button>}{item.type==='file'&&<a href={item.html_url} target="_blank" rel="noreferrer" aria-label={'View '+item.name+' on GitHub'} title="View this exact file on GitHub" className="file-github-link"><GitHubMark size={14}/></a>}</div>)}</div>}
        {selectedFile&&<div className={'code-viewer '+(expanded?'code-viewer-expanded':'')}>
          <div className="code-viewer-toolbar"><div className="code-file-meta"><Code2 size={14}/><span>{selectedFile.path}</span><span className="readonly-pill">READ ONLY</span></div>
            <div className="code-toolbar-actions"><button className="icon-link code-options-trigger" aria-label={expanded?"Restore code viewer":"Expand code viewer"} aria-pressed={expanded} title={expanded?"Restore code viewer":"Expand code viewer"} onClick={()=>setOptionsOpen(!optionsOpen)}><span className="square-options"><span/><span/><span/><span/></span></button>
              {optionsOpen&&<div className="code-options-menu"><button onClick={copyCode}><Code2 size={14}/>{copyLabel}</button><button onClick={downloadCode}><ArrowDownRight size={14}/>Download file</button><button onClick={()=>{setExpanded(!expanded);setOptionsOpen(false);}}><ExternalLink size={14}/>{expanded?'Exit expanded view':'Expand viewer'}</button><a href={selectedFile.html_url} target="_blank" rel="noreferrer" onClick={()=>setOptionsOpen(false)}><GitHubMark size={14}/>Open on GitHub</a></div>}
            </div>
          </div>
          {fileLoading?<div className="code-status"><RefreshCw size={17} className="spin-icon"/> Loading source from GitHub…</div>:fileError?<div className="code-status code-error">{fileError}<a href={selectedFile.html_url} target="_blank" rel="noreferrer">Open on GitHub <ArrowUpRight size={13}/></a></div>:<pre className="source-code" aria-label="Read-only source code"><code>{fileContent.split('\n').map((line,index)=><span className="code-line" key={index}><span className="line-number">{index+1}</span><span className="code-line-text">{highlightLine(line)}</span></span>)}</code></pre>}
        </div>}
        <div className="lab-footer"><span><CircleDot size={12}/> No token · No private access</span><span>Public repositories only</span></div>
      </div>
    </div>
    <p className="lab-note">Explorer uses GitHub's unauthenticated public API. Rate limits apply; this panel never requests private repository access.</p>
  </div>;
}
export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [year] = useState(new Date().getFullYear());
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      document.documentElement.style.setProperty('--scroll-progress', (max > 0 ? window.scrollY / max * 100 : 0) + '%');
    };
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: 0.12 });
    document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    return () => { window.removeEventListener('scroll', onScroll); observer.disconnect(); };
  }, []);
  const closeMenu = () => setMenuOpen(false);
  return <><div className="scroll-progress" />
    <header className="site-header">
      <a className="brand" href="#home" onClick={closeMenu}><span className="brand-mark">M<span>.</span></span><span className="brand-word">MAHESH <i>BABU</i></span></a>
      <button className="mobile-menu" onClick={()=>setMenuOpen(!menuOpen)} aria-label={menuOpen?'Close navigation':'Open navigation'}>{menuOpen?<X/>:<Menu/>}</button>
      <nav className={menuOpen?'main-nav open':'main-nav'}><a href="#work" onClick={closeMenu}>Selected work <span>↘</span></a><a href="#approach" onClick={closeMenu}>Approach <span>↘</span></a><a href="#github-lab" onClick={closeMenu}>GitHub lab <span>↘</span></a><a href="#about" onClick={closeMenu}>About <span>↘</span></a></nav>
      <a className="header-cta" href="https://github.com/BoyidapuMaheshBabu" target="_blank" rel="noreferrer">GitHub profile <ArrowUpRight size={15}/></a>
    </header>
    <main id="home">
      <section className="hero section-wrap">
        <div className="hero-copy" data-reveal>
          <div className="eyebrow"><span className="live-dot"/> ASPIRING SOFTWARE ENGINEER <span className="eyebrow-rule"/> BUILDING IN PUBLIC</div>
          <h1>I build to<br/>understand<span className="accent">.</span><br/><em>Then build better.</em></h1>
          <p className="hero-description">I'm <strong>Mahesh Babu</strong> — a Diploma Computer Science student learning software engineering by taking ideas from problem to prototype, testing what I build, and improving what I learn.</p>
          <div className="hero-actions"><a className="button primary" href="#work">Explore my work <ArrowDownRight size={17}/></a><a className="button secondary" href="https://github.com/BoyidapuMaheshBabu" target="_blank" rel="noreferrer"><GitHubMark size={16}/> View GitHub <ArrowUpRight size={15}/></a></div>
          <div className="hero-note"><Sparkles size={14}/> Curious by default. Honest about the process.</div>
        </div>
        <div className="hero-visual" data-reveal>
          <div className="visual-orbit orbit-a"/><div className="visual-orbit orbit-b"/><div className="visual-label label-top"><span className="live-dot"/> CURRENT FOCUS / 01</div>
          <div className="focus-card">
            <div className="focus-card-top"><span><i/> <i/> <i/></span><span>TERMRUNWAY / ANDROID</span><span className="focus-version">V1</span></div>
            <div className="focus-inner"><div className="micro-label">PRODUCT ENGINEERING · LEARNING BY BUILDING</div><h2>Money, with<br/><em>a plan.</em></h2><p>One genuine expense. Two useful views.</p>
              <div className="mock-dashboard"><div className="mock-head"><span>SEMESTER OVERVIEW</span><span className="mock-chip">LOCAL-FIRST</span></div><div className="mock-amount">₹ 8,450<span>.00</span></div><div className="mock-chart">{[30,48,35,66,44,82,58,73,46,91,65,76,54,86,63,100,71,83,58,94].map((n,i)=><i key={i} style={{'--h':n+'%'}}/>)}</div><div className="mock-foot"><span><b/> Illustrative interface</span><span>Concept preview</span></div></div>
              <div className="focus-detail"><span className="detail-icon"><Code2 size={16}/></span><span><b>Build with intention</b><small>Understand the problem first</small></span><ArrowUpRight size={15}/></div>
            </div><div className="focus-card-bottom"><span><i/> PRODUCT THINKING</span><span>01 / 03</span></div>
          </div>
          <div className="visual-label label-bottom">THINK <b>→</b> BUILD <b>→</b> VERIFY</div>
          <div className="floating-chip chip-one"><span>✳</span> Small steps, real progress</div><div className="floating-chip chip-two"><Code2 size={14}/> Code is a tool</div>
        </div>
      </section>
      <div className="ticker" aria-label="Areas of focus"><div className="ticker-track">{Array.from({length:2},(_,i)=><span key={i}>PRODUCT THINKING <b>✳</b> SOFTWARE ENGINEERING <b>✳</b> PROBLEM SOLVING <b>✳</b> BUILD · TEST · IMPROVE <b>✳</b> LEARN IN PUBLIC <b>✳</b></span>)}</div></div>
      <section className="section-wrap section work-section" id="work">
        <div className="section-heading" data-reveal><div><div className="eyebrow"><span className="section-index">01 / SELECTED WORK</span></div><h2>Ideas, made <em>real.</em></h2></div><p>Not a list of buzzwords. A record of things I’m building, the problems they address, and the skills I’m developing along the way.</p></div>
        <div className="project-grid">{FEATURED.map(project=>{const Icon=project.icon;return <article className={'project-card '+project.color} key={project.name} data-reveal><div className="project-card-top"><span>{project.number} <i/> {project.type}</span><a href={project.url} target="_blank" rel="noreferrer" aria-label={'Open '+project.name}><ArrowUpRight size={17}/></a></div><div className="project-art"><div className="art-grid"/><div className="art-icon"><Icon size={28}/></div><span className="art-orbit"/><span className="art-word">{project.number}</span></div><div className="project-body"><h3>{project.title}</h3><p>{project.description}</p><div className="tag-row">{project.stack.map(tag=><span key={tag}>{tag}</span>)}</div><a className="text-link" href={project.url} target="_blank" rel="noreferrer">Explore repository <ArrowUpRight size={15}/></a></div></article>})}</div>
      </section>
      <section className="approach-section" id="approach"><div className="section-wrap section"><div className="section-heading" data-reveal><div><div className="eyebrow"><span className="section-index">02 / APPROACH</span></div><h2>How I move from<br/><em>idea to understanding.</em></h2></div><p>I’m early in my journey. My focus is not pretending to know everything—it’s getting better at asking the right questions and verifying the work.</p></div><div className="principles">{[{n:'01',title:'Understand the problem',text:'Start with the user, the constraint, and what a useful result should look like.'},{n:'02',title:'Build a real solution',text:'Use tools—including AI—as assistants, while staying responsible for decisions.'},{n:'03',title:'Test what matters',text:'Check behavior, inspect failures, and make sure the implementation matches the intent.'},{n:'04',title:'Improve with evidence',text:'Use feedback, Git history, and lessons from mistakes to make the next iteration stronger.'}].map((item,i)=><article className="principle" data-reveal key={item.n}><span className="principle-number">{item.n}</span><div><h3>{item.title}</h3><p>{item.text}</p></div><ArrowDownRight size={18}/></article>)}</div></div></section>
      <section className="section-wrap section lab-section" id="github-lab"><div className="section-heading" data-reveal><div><div className="eyebrow"><span className="section-index">03 / GITHUB LAB</span></div><h2>Look inside the <em>work.</em></h2></div><p>Explore my public repositories and browse their source files without leaving this page. The explorer reads public data directly from GitHub.</p></div><div data-reveal><GitHubLab/></div></section>
      <section className="about-section" id="about"><div className="section-wrap about-layout"><div data-reveal><div className="eyebrow"><span className="section-index">04 / ABOUT</span></div><h2>Still learning.<br/><em>Already building.</em></h2></div><div data-reveal><p className="about-lead">I’m a Diploma Computer Science student working toward becoming a stronger software engineer through practical projects and deliberate problem solving.</p><p className="about-copy">I’m interested in software products, AI-assisted development, and the engineering behind useful tools. I value understanding over copying, honest progress over inflated claims, and working software over ideas that never leave a notebook.</p><a className="button secondary" href="https://github.com/BoyidapuMaheshBabu" target="_blank" rel="noreferrer"><GitHubMark size={16}/> Follow the journey <ArrowUpRight size={15}/></a></div></div></section>
      <section className="closing-section"><div className="section-wrap closing-card" data-reveal><span className="closing-star">✳</span><div className="eyebrow">THE NEXT ITERATION STARTS HERE</div><h2>Make something<br/><em>that matters.</em></h2><p>Every project is a chance to learn something real.</p><a className="button primary" href="https://github.com/BoyidapuMaheshBabu" target="_blank" rel="noreferrer">Find me on GitHub <ArrowUpRight size={16}/></a></div></section>
    </main>
    <footer className="site-footer"><a className="brand" href="#home"><span className="brand-mark">M<span>.</span></span><span className="brand-word">MAHESH <i>BABU</i></span></a><span>Built with curiosity, improved with evidence.</span><span>© {year} Mahesh Babu</span></footer>
  </>;
}
