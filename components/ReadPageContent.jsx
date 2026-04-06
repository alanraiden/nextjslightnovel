'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getNovel, getNovelBySlug, getChapter, getChapters, getNovels } from '@/services/api';
import '@/app/read/ReadPage.css';
import AdBanner from '@/components/AdBanner';
import CommentSection from '@/components/CommentSection';

const FONT_SIZES = [13, 15, 16, 17, 18, 19, 20, 22, 24, 26];
const FONT_FAMILIES = [
  { id: 'serif',    label: 'Serif',   style: "'Crimson Pro', Georgia, serif" },
  { id: 'sans',     label: 'Sans',    style: "'Inter', system-ui, sans-serif" },
  { id: 'mono',     label: 'Mono',    style: "'JetBrains Mono', monospace" },
  { id: 'dyslexic', label: 'OpenDys', style: "'OpenDyslexic', Arial, sans-serif" },
];
const PLACEHOLDER = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=600&fit=crop';

export default function ReadPageContent() {
  const params = useParams();
  const router = useRouter();

  // Support both /read/s/[slug]/[chapterSlug] and /read/[id]/[chapterNum]
  const slug        = params.slug        || null;
  const id          = params.id          || null;
  const chapterSlug = params.chapterSlug || null;
  const chapterNum  = params.chapterNum  || null;

  const rawNum = chapterSlug || chapterNum || '1';
  const num = parseInt(String(rawNum).replace(/[^0-9]/g, '')) || 1;

  const [novel,    setNovel]    = useState(null);
  const [chapter,  setChapter]  = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [similar,  setSimilar]  = useState([]);

  const [fontSize,    setFontSize]    = useState(18);
  const [fontFamily,  setFontFamily]  = useState('serif');
  const [lineHeight,  setLineHeight]  = useState(1.9);
  const [readMode,    setReadMode]    = useState('dark');
  const [showSettings, setShowSettings] = useState(false);
  const [progress,    setProgress]    = useState(0);
  const [showToc,     setShowToc]     = useState(false);
  const [tocSearch,   setTocSearch]   = useState('');

  const contentRef  = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedSize   = localStorage.getItem('ns_fontsize');
    const savedFamily = localStorage.getItem('ns_fontfamily');
    const savedLH     = localStorage.getItem('ns_lineheight');
    const savedMode   = localStorage.getItem('ns_readmode');
    if (savedSize)   setFontSize(Number(savedSize));
    if (savedFamily) setFontFamily(savedFamily);
    if (savedLH)     setLineHeight(Number(savedLH));
    if (savedMode)   setReadMode(savedMode);
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true); setError(''); setChapter(null); setNovel(null);
      try {
        const n = slug ? await getNovelBySlug(slug) : await getNovel(id);
        setNovel(n);
        const [chs, ch] = await Promise.all([getChapters(n._id), getChapter(n._id, num)]);
        setChapters(chs);
        setChapter(ch);

        // Save reading history
        try {
          const READING_KEY = 'ns_reading_history';
          const history = JSON.parse(localStorage.getItem(READING_KEY) || '[]');
          const entry = {
            novelId: n._id, novelSlug: n.slug || null, title: n.title,
            cover: n.cover || '', chapterNum: num, totalChapters: chs.length, readAt: Date.now(),
          };
          const filtered = history.filter(h => h.novelId !== n._id);
          localStorage.setItem(READING_KEY, JSON.stringify([entry, ...filtered].slice(0, 10)));
        } catch {}

        // Fetch similar novels
        if (n.genres && n.genres.length > 0) {
          try {
            const res = await getNovels({ genre: n.genres[0], limit: 10 });
            const others = (res.novels || []).filter(x => x._id !== n._id);
            setSimilar(others.sort(() => Math.random() - 0.5).slice(0, 4));
          } catch {}
        }
      } catch (err) {
        setError(err.message || 'Chapter not found.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, slug, num]);

  useEffect(() => { window.scrollTo(0, 0); }, [id, slug, num]);

  useEffect(() => {
    const handle = () => {
      const el = contentRef.current;
      if (!el) return;
      const scrolled = Math.max(0, window.scrollY - el.offsetTop);
      setProgress(Math.min(100, Math.round((scrolled / el.offsetHeight) * 100)));
    };
    window.addEventListener('scroll', handle);
    return () => window.removeEventListener('scroll', handle);
  }, [chapter]);

  function changeFontSize(delta) {
    const idx  = FONT_SIZES.indexOf(fontSize);
    const next = FONT_SIZES[Math.max(0, Math.min(FONT_SIZES.length - 1, idx + delta))];
    setFontSize(next);
    localStorage.setItem('ns_fontsize', next);
  }
  function changeMode(m)       { setReadMode(m);    localStorage.setItem('ns_readmode',   m); }
  function changeFontFamily(f) { setFontFamily(f);  localStorage.setItem('ns_fontfamily', f); }
  function changeLineHeight(v) { setLineHeight(v);  localStorage.setItem('ns_lineheight', v); }

  const sortedChapters = [...chapters].sort((a, b) => a.number - b.number);
  const currentIdx     = sortedChapters.findIndex(c => c.number === num);
  const prevChapter    = currentIdx > 0 ? sortedChapters[currentIdx - 1] : null;
  const nextChapter    = currentIdx < sortedChapters.length - 1 ? sortedChapters[currentIdx + 1] : null;

  function chapterHref(ch) {
    if (!ch) return '/';
    if (novel?.slug) return `/read/s/${novel.slug}/chapter-${ch.number}`;
    return `/read/${novel?._id || id}/${ch.number}`;
  }

  function onTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }
  function onTouchEnd(e) {
    if (touchStartX.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = Math.abs(touchStartY.current - e.changedTouches[0].clientY);
    if (Math.abs(dx) > 60 && Math.abs(dx) > dy * 1.5) {
      if (dx > 0 && nextChapter) router.push(chapterHref(nextChapter));
      else if (dx < 0 && prevChapter) router.push(chapterHref(prevChapter));
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }

  function formatContent(content) {
    if (!content) return '';
    return content
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');
  }

  return (
    <div className={`read-page read-mode-${readMode}`} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="read-progress-bar">
        <div className="read-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Toolbar */}
      <div className="read-toolbar">
        <Link href={novel?.slug ? `/novel/s/${novel.slug}` : `/novel/${id || novel?._id}`} className="read-back-btn">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          <span>{novel?.title || 'Back'}</span>
        </Link>

        <div className="read-chapter-info">
          {chapter ? `Chapter ${chapter.number}` : loading ? '...' : 'Chapter'}
        </div>

        <div className="read-toolbar-actions">
          <div className="font-size-controls">
            <button onClick={() => changeFontSize(-1)}>A-</button>
            <span>{fontSize}px</span>
            <button onClick={() => changeFontSize(1)}>A+</button>
          </div>
          <button className="toc-btn read-settings-btn" onClick={() => setShowSettings(s => !s)} title="Reading Settings">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          </button>
          <button className="toc-btn" onClick={() => setShowToc(!showToc)} title="Table of Contents">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <span className="read-progress-text">{progress}%</span>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="read-settings-panel">
          <div className="read-settings-header">
            <span>Reading Settings</span>
            <button onClick={() => setShowSettings(false)}>✕</button>
          </div>
          <div className="read-settings-body">
            <div className="read-settings-row">
              <label>Theme</label>
              <div className="mode-toggle">
                <button className={readMode === 'dark'  ? 'active' : ''} onClick={() => changeMode('dark')}>🌙 Dark</button>
                <button className={readMode === 'sepia' ? 'active' : ''} onClick={() => changeMode('sepia')}>📜 Sepia</button>
                <button className={readMode === 'light' ? 'active' : ''} onClick={() => changeMode('light')}>☀️ Light</button>
              </div>
            </div>
            <div className="read-settings-row">
              <label>Font</label>
              <div className="font-family-picker">
                {FONT_FAMILIES.map(f => (
                  <button key={f.id} className={fontFamily === f.id ? 'active' : ''} style={{ fontFamily: f.style }} onClick={() => changeFontFamily(f.id)}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="read-settings-row">
              <label>Size — {fontSize}px</label>
              <div className="settings-slider-row">
                <button onClick={() => changeFontSize(-1)}>A-</button>
                <input type="range" min="13" max="26" value={fontSize}
                  onChange={e => { setFontSize(Number(e.target.value)); localStorage.setItem('ns_fontsize', e.target.value); }}
                  className="settings-slider" />
                <button onClick={() => changeFontSize(1)}>A+</button>
              </div>
            </div>
            <div className="read-settings-row">
              <label>Line Spacing — {lineHeight}x</label>
              <div className="settings-slider-row">
                <span style={{fontSize:'0.8rem'}}>Tight</span>
                <input type="range" min="1.4" max="2.4" step="0.1" value={lineHeight}
                  onChange={e => changeLineHeight(Number(e.target.value))} className="settings-slider" />
                <span style={{fontSize:'0.8rem'}}>Wide</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOC Overlay + Drawer */}
      {showToc && <div className="toc-overlay" onClick={() => setShowToc(false)}/>}
      <div className={`toc-drawer ${showToc ? 'toc-open' : ''}`}>
        <div className="toc-header">
          <div className="toc-header-top">
            <div className="toc-header-title">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              Table of Contents
            </div>
            <button className="toc-close-btn" onClick={() => { setShowToc(false); setTocSearch(''); }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          {novel?.title && <div className="toc-novel-title">{novel.title}</div>}
          <div className="toc-search">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" placeholder="Search chapters..." value={tocSearch} onChange={e => setTocSearch(e.target.value)} autoComplete="off"/>
            {tocSearch && <button className="toc-search-clear" onClick={() => setTocSearch('')}>✕</button>}
          </div>
        </div>
        <div className="toc-count">
          {tocSearch
            ? `${sortedChapters.filter(ch => ch.title.toLowerCase().includes(tocSearch.toLowerCase()) || String(ch.number).includes(tocSearch)).length} results`
            : `${sortedChapters.length} chapters`}
        </div>
        <div className="toc-list">
          {sortedChapters
            .filter(ch => !tocSearch || ch.title.toLowerCase().includes(tocSearch.toLowerCase()) || String(ch.number).includes(tocSearch))
            .map(ch => (
              <Link key={ch._id}
                href={novel?.slug ? `/read/s/${novel.slug}/chapter-${ch.number}` : `/read/${novel?._id}/${ch.number}`}
                className={`toc-item ${ch.number === num ? 'active' : ''}`}
                onClick={() => { setShowToc(false); setTocSearch(''); }}>
                <span className="toc-num">Ch.{ch.number}</span>
                <span className="toc-title">{ch.title}</span>
                {ch.number === num && <span className="toc-current-dot"/>}
              </Link>
            ))}
          {tocSearch && sortedChapters.filter(ch => ch.title.toLowerCase().includes(tocSearch.toLowerCase()) || String(ch.number).includes(tocSearch)).length === 0 && (
            <div className="toc-empty">No chapters match</div>
          )}
        </div>
      </div>

      {/* Floating TOC button */}
      {!showToc && chapter && (
        <button className="toc-float-btn" onClick={() => setShowToc(true)}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          <span>Chapters</span>
        </button>
      )}

      {/* Reading Content */}
      <div className="reading-container" ref={contentRef}>
        {loading && (
          <div className="read-loading">
            <div className="read-spinner" />
            <div>Loading chapter...</div>
          </div>
        )}

        {error && (
          <div className="read-error">
            <div style={{fontSize:'2.5rem',marginBottom:'16px'}}>📭</div>
            <div style={{marginBottom:'8px',fontWeight:600}}>Could not load chapter</div>
            <div style={{fontSize:'0.75rem',opacity:0.7,marginBottom:'16px'}}>{error}</div>
            <Link
              href={novel?.slug ? `/novel/s/${novel.slug}` : slug ? `/novel/s/${slug}` : `/novel/${id}`}
              className="btn-secondary"
              style={{marginTop:'8px',display:'inline-flex'}}>
              Back to Novel
            </Link>
          </div>
        )}

        {!loading && !error && chapter && (
          <>
            <div className="reading-chapter-header">
              <div className="reading-novel-title">{novel?.title}</div>
              <h2 className="reading-chapter-title">Chapter {chapter.number}: {chapter.title}</h2>
              <div className="reading-meta">
                <span>{new Date(chapter.createdAt).toLocaleDateString()}</span>
                <span>·</span>
                <span>{(chapter.wordCount || 0).toLocaleString()} words</span>
                <span>·</span>
                <span>{(chapter.views || 0).toLocaleString()} views</span>
              </div>
            </div>

            <AdBanner slot="8630276662" style={{margin:'24px 0'}} />

            <div
              className="reading-content"
              style={{
                fontSize: `${fontSize}px`,
                fontFamily: FONT_FAMILIES.find(f => f.id === fontFamily)?.style || undefined,
                lineHeight: lineHeight,
              }}
              dangerouslySetInnerHTML={{ __html: formatContent(chapter.content) }}
            />

            <AdBanner slot="4207450966" style={{margin:'32px 0'}} />

            <div className="kofi-reading-cta">
              <div className="kofi-cta-text">
                <strong>Enjoying this chapter?</strong>
                <span>Support the platform on Ko-fi</span>
              </div>
              <a href="https://ko-fi.com/idenwebstudio" target="_blank" rel="noopener noreferrer" className="kofi-cta-btn">
                Buy a Coffee
              </a>
            </div>

            {/* Chapter Navigation */}
            <div className="reading-nav">
              {prevChapter ? (
                <Link href={chapterHref(prevChapter)} className="read-nav-btn prev">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                  <span>Ch. {prevChapter.number}</span>
                </Link>
              ) : <div />}

              <Link href={novel?.slug ? `/novel/s/${novel.slug}` : `/novel/${id || novel?._id}`} className="read-nav-toc">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                Contents
              </Link>

              {nextChapter ? (
                <Link href={chapterHref(nextChapter)} className="read-nav-btn next">
                  <span>Ch. {nextChapter.number}</span>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
              ) : (
                <div className="read-nav-btn next" style={{opacity:0.4,pointerEvents:'none'}}>
                  <span>Last Chapter</span>
                </div>
              )}
            </div>

            {/* You May Also Like */}
            {similar.length > 0 && (
              <div className="similar-novels">
                <div className="similar-novels-header">
                  <span className="similar-novels-label">You May Also Like</span>
                </div>
                <div className="similar-novels-grid">
                  {similar.map(s => (
                    <a key={s._id} href={s.slug ? `/novel/s/${s.slug}` : `/novel/${s._id}`} className="similar-novel-card">
                      <div className="similar-novel-cover">
                        <img src={s.cover || PLACEHOLDER} alt={s.title} loading="lazy" onError={e => { e.target.src = PLACEHOLDER; }}/>
                      </div>
                      <div className="similar-novel-info">
                        <div className="similar-novel-title">{s.title}</div>
                        <div className="similar-novel-tags">
                          {(s.genres || []).slice(0, 2).map(g => <span key={g} className="similar-novel-tag">{g}</span>)}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            {novel && (
              <div className="read-comments">
                <CommentSection novelId={novel._id} chapterNum={num}/>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
