'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import NovelCard from '@/components/NovelCard';
import { getNovels } from '@/services/api';
import PageLayout from '@/components/PageLayout';
import './Home.css';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=600&fit=crop';
const READING_KEY = 'ns_reading_history';

function getReadingHistory() {
  try { return JSON.parse(localStorage.getItem(READING_KEY) || '[]'); }
  catch { return []; }
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth <= 600);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return mobile;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function StarRating({ rating }) {
  return (
    <div className="hero-rating">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i <= Math.floor(rating) ? 'var(--accent-gold)' : 'var(--text-muted)'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
      <span>{rating} / 5.0</span>
    </div>
  );
}

function NovelCardSkeleton() {
  return (
    <div className="novel-card skeleton-card">
      <div className="skeleton-cover" />
      <div className="skeleton-info">
        <div className="skeleton-line" style={{width:'80%'}} />
        <div className="skeleton-line" style={{width:'50%'}} />
        <div className="skeleton-line" style={{width:'65%'}} />
      </div>
    </div>
  );
}

function HeroSlider({ novels, loading }) {
  const [current, setCurrent]     = useState(0);
  const [animating, setAnimating] = useState(false);
  const [isMobile, setIsMobile]   = useState(false);
  const timerRef    = useRef(null);
  const touchStartX = useRef(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 600);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const goTo = useCallback((idx) => {
    if (animating) return;
    setAnimating(true); setCurrent(idx);
    setTimeout(() => setAnimating(false), 500);
  }, [animating]);

  const next = useCallback(() => { if (!novels.length) return; goTo((current + 1) % novels.length); }, [current, novels.length, goTo]);
  const prev = useCallback(() => { if (!novels.length) return; goTo((current - 1 + novels.length) % novels.length); }, [current, novels.length, goTo]);

  useEffect(() => {
    if (!novels.length) return;
    timerRef.current = setInterval(next, 9000);
    return () => clearInterval(timerRef.current);
  }, [next, novels.length]);

  const pause  = () => clearInterval(timerRef.current);
  const resume = () => { timerRef.current = setInterval(next, 9000); };
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; pause(); };
  const onTouchEnd   = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
    touchStartX.current = null; resume();
  };

  if (loading) {
    return (
      <section className="hero">
        <div className="hero-bg-art active">
          <div style={{width:'100%',height:'100%',background:'var(--bg-secondary)'}}/><div className="hero-bg-overlay"/>
        </div>
        <div className="container hero-content">
          <div className="hero-skeleton">
            <div className="skeleton-line" style={{width:'30%',height:'0.8rem',marginBottom:'20px',borderRadius:'100px'}}/>
            <div className="skeleton-line" style={{width:'65%',height:'2.5rem',marginBottom:'16px'}}/>
            <div className="skeleton-line" style={{width:'40%',marginBottom:'12px'}}/>
            <div className="skeleton-line" style={{width:'85%',marginBottom:'8px'}}/>
            <div className="skeleton-line" style={{width:'70%',marginBottom:'28px'}}/>
            <div style={{display:'flex',gap:'12px'}}>
              <div className="skeleton-line" style={{width:'130px',height:'42px',borderRadius:'8px'}}/>
              <div className="skeleton-line" style={{width:'110px',height:'42px',borderRadius:'8px'}}/>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!novels.length) return null;
  const hero = novels[current];
  const heroUrl = hero.slug ? `/novel/s/${hero.slug}` : `/novel/${hero._id}`;

  if (isMobile) {
    return (
      <section className="hero-mobile-section" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="hero-mobile-label"><span className="hero-badge-dot"/>Featured Novel</div>
        <Link href={heroUrl} className={`hero-mobile-card ${animating ? 'hero-fade' : ''}`}>
          <div className="hero-mobile-text">
            <h2 className="hero-mobile-title">{hero.title}</h2>
            <div className="hero-mobile-stats">
              <span>{hero.chapterCount} Ch.</span><span className="hero-stat-sep">·</span>
              <span>{hero.views?.toLocaleString()} Views</span>
            </div>
            <div className="hero-mobile-rating">
              {[1,2,3,4,5].map(i => (
                <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill={i <= Math.floor(hero.rating) ? 'var(--accent-gold)' : 'var(--text-muted)'}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              ))}
              <span>{hero.rating}</span>
            </div>
            <p className="hero-mobile-desc">{hero.description}</p>
          </div>
          <div className="hero-mobile-right">
            <div className="hero-mobile-cover">
              <img src={hero.cover || PLACEHOLDER} alt={hero.title} onError={e => { e.target.src = PLACEHOLDER; }}/>
            </div>
            <div className="hero-mobile-read-btn">
              <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              Start Reading
            </div>
          </div>
        </Link>
        {novels.length > 1 && (
          <div className="hero-dots hero-mobile-dots">
            {novels.map((_, i) => <button key={i} className={`hero-dot ${i === current ? 'active' : ''}`} onClick={() => goTo(i)}/>)}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="hero hero-slider" onMouseEnter={pause} onMouseLeave={resume} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {novels.map((n, i) => (
        <div key={n._id} className={`hero-bg-art ${i === current ? 'active' : ''}`}>
          <img src={n.cover || PLACEHOLDER} alt="" aria-hidden="true" loading={i === 0 ? 'eager' : 'lazy'}/>
          <div className="hero-bg-overlay"/>
        </div>
      ))}
      <div className={`container hero-content ${animating ? 'hero-fade' : ''}`}>
        <div className="hero-badge"><span className="hero-badge-dot"/>Featured Novel</div>
        <h1 className="hero-title">{hero.title}</h1>
        <div className="hero-meta">
          <span className="hero-author">by {hero.author}</span>
          <StarRating rating={hero.rating}/>
          <div className="hero-stats">
            <span>{hero.chapterCount} Chapters</span><span className="hero-stat-sep">·</span>
            <span>{hero.views?.toLocaleString()} Views</span><span className="hero-stat-sep">·</span>
            <span className={`badge badge-${hero.status}`}>{hero.status}</span>
          </div>
        </div>
        <div className="hero-genres">
          {(hero.genres || []).map(g => <span key={g} className="hero-genre-tag">{g}</span>)}
        </div>
        <p className="hero-description">{hero.description}</p>
        <div className="hero-actions">
          <Link href={heroUrl} className="btn-primary">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            Start Reading
          </Link>
          <Link href={heroUrl} className="btn-secondary">View Details</Link>
        </div>
      </div>
      <div className="hero-cover-showcase">
        <div className="cover-float">
          <img src={hero.cover || PLACEHOLDER} alt={hero.title} onError={e => { e.target.src = PLACEHOLDER; }}/>
          <div className="cover-glow"/>
        </div>
      </div>
      {novels.length > 1 && (
        <>
          <button className="hero-arrow hero-arrow-prev" onClick={prev}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button className="hero-arrow hero-arrow-next" onClick={next}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
          </button>
          <div className="hero-dots">
            {novels.map((_, i) => <button key={i} className={`hero-dot ${i === current ? 'active' : ''}`} onClick={() => goTo(i)}/>)}
          </div>
        </>
      )}
    </section>
  );
}

function LatestUpdates({ latestAll, loading, isMobile }) {
  const [view, setView] = useState('list');
  const [page, setPage] = useState(1);
  const PER_PAGE = 12;
  const totalPages = Math.ceil(latestAll.length / PER_PAGE);
  const paged = latestAll.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function goPage(p) {
    setPage(p);
    if (isMobile) document.getElementById('latest-updates-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <section className="home-section lu-section" id="latest-updates-section">
      <div className="section-title lu-header">
        <span>🕐</span><span>Latest Updates</span>
        <Link href="/updates" className="section-see-all" style={{marginLeft:'auto'}}>See All →</Link>
        <div className="lu-toggle">
          <button className={`lu-toggle-btn ${view === 'list' ? 'active' : ''}`} onClick={() => { setView('list'); setPage(1); }} title="List view">
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            List
          </button>
          <button className={`lu-toggle-btn ${view === 'grid' ? 'active' : ''}`} onClick={() => { setView('grid'); setPage(1); }} title="Grid view">
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            Grid
          </button>
        </div>
      </div>

      {view === 'list' && (
        <div className="lu-list">
          {loading ? [...Array(5)].map((_,i) => (
            <div key={i} className="update-item">
              <div className="skeleton-cover" style={{width:'52px',height:'72px',flexShrink:0}}/>
              <div className="skeleton-info" style={{flex:1}}>
                <div className="skeleton-line" style={{width:'70%'}}/><div className="skeleton-line" style={{width:'40%'}}/><div className="skeleton-line" style={{width:'30%'}}/>
              </div>
            </div>
          )) : paged.map(n => (
            <Link href={n.slug ? `/novel/s/${n.slug}` : `/novel/${n._id}`} key={n._id} className="lu-list-item">
              <img src={n.cover || PLACEHOLDER} alt={n.title} className="lu-list-cover" loading="lazy" onError={e => { e.target.src = PLACEHOLDER; }}/>
              <div className="lu-list-info">
                <div className="lu-list-title">{n.title}</div>
                <div className="lu-list-chapter">{n.chapterCount > 0 ? `Ch.${n.chapterCount}` : 'No chapters'}</div>
                <div className="lu-list-meta">
                  <span className={`badge badge-${n.status}`}>{n.status}</span>
                  <span className="lu-list-date">{timeAgo(n.updatedAt)}</span>
                </div>
              </div>
              <svg className="lu-list-arrow" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
            </Link>
          ))}
        </div>
      )}

      {view === 'grid' && (
        <div className="lu-grid">
          {loading ? [...Array(10)].map((_,i) => (
            <div key={i} className="lu-grid-card lu-grid-skeleton">
              <div className="skeleton-cover lu-grid-cover"/>
              <div className="lu-grid-info"><div className="skeleton-line" style={{width:'90%',height:'0.7rem'}}/><div className="skeleton-line" style={{width:'55%',height:'0.65rem'}}/></div>
            </div>
          )) : paged.map(n => (
            <Link href={n.slug ? `/novel/s/${n.slug}` : `/novel/${n._id}`} key={n._id} className="lu-grid-card">
              <div className="lu-grid-cover-wrap">
                <img src={n.cover || PLACEHOLDER} alt={n.title} className="lu-grid-cover" loading="lazy" onError={e => { e.target.src = PLACEHOLDER; }}/>
                <div className="lu-grid-chapter-badge">{n.chapterCount > 0 ? `Ch.${n.chapterCount}` : '—'}</div>
              </div>
              <div className="lu-grid-info">
                <div className="lu-grid-title">{n.title}</div>
                <div className="lu-grid-date">{timeAgo(n.updatedAt)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="updates-pagination">
          <button className="updates-page-btn" disabled={page === 1} onClick={() => goPage(page - 1)}>‹</button>
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} className={`updates-page-btn${page === i + 1 ? ' active' : ''}`} onClick={() => goPage(i + 1)}>{i + 1}</button>
          ))}
          <button className="updates-page-btn" disabled={page === totalPages} onClick={() => goPage(page + 1)}>›</button>
        </div>
      )}
    </section>
  );
}

export default function HomePage() {
  const [continueReading, setContinue] = useState([]);
  const isMobile = useIsMobile();
  const [featured, setFeatured]       = useState([]);
  const [trending, setTrending]       = useState([]);
  const [trendTab, setTrendTab]       = useState('week');
  const [trendCache, setTrendCache]   = useState({});
  const [trendLoading, setTrendLoading] = useState(false);
  const [topRated, setTopRated]       = useState([]);
  const [latestAll, setLatestAll]     = useState([]);
  const [recentlyAdded, setRecent]    = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => { setContinue(getReadingHistory().slice(0, 5)); }, []);

  useEffect(() => {
    async function load() {
      try {
        const [byWeek, byAllViews, byRating, byNew, byAdded] = await Promise.all([
          getNovels({ sort: 'week',   limit: 12 }),
          getNovels({ sort: 'views',  limit: 12 }),
          getNovels({ sort: 'rating', limit: 12 }),
          getNovels({ sort: 'new',    limit: 50 }),
          getNovels({ sort: 'added',  limit: 12 }),
        ]);
        const trendNovels = byWeek.novels    || [];
        const allNovels   = byAllViews.novels || [];
        const ratedNovels = byRating.novels  || [];
        const newNovels   = byNew.novels     || [];
        const addedNovels = byAdded.novels   || [];

        const seen = new Set(); const feat = [];
        for (const n of [...ratedNovels, ...allNovels]) {
          if (!seen.has(n._id) && feat.length < 9) { seen.add(n._id); feat.push(n); }
        }
        setFeatured(feat);
        setTrending(trendNovels.slice(0, 12));
        setTrendCache({ week: trendNovels.slice(0, 12), all: allNovels.slice(0, 12) });
        setTopRated(ratedNovels.slice(0, 12));
        setLatestAll(newNovels);
        setRecent(addedNovels.slice(0, 12));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  async function fetchTrendTab(tab) {
    if (trendCache[tab]) { setTrending(trendCache[tab]); setTrendTab(tab); return; }
    setTrendLoading(true); setTrendTab(tab);
    try {
      const sortMap = { today: 'today', week: 'week', month: 'month', all: 'views' };
      const res = await getNovels({ sort: sortMap[tab] || 'views', limit: 12 });
      const novels = res.novels || [];
      setTrending(novels);
      setTrendCache(prev => ({ ...prev, [tab]: novels }));
    } catch {}
    setTrendLoading(false);
  }

  return (
    <PageLayout>
      <div className="home">
        <HeroSlider novels={featured} loading={loading}/>

        <div className="container home-sections">
          {continueReading.length > 0 && (
            <section className="home-section continue-section">
              <div className="section-title"><span>📖</span> Continue Reading</div>
              <div className="continue-list">
                {continueReading.map(item => (
                  <Link key={item.novelId}
                    href={item.novelSlug ? `/read/s/${item.novelSlug}/chapter-${item.chapterNum}` : `/read/${item.novelId}/${item.chapterNum}`}
                    className="continue-card">
                    <img src={item.cover || PLACEHOLDER} alt={item.title} className="continue-cover" onError={e => { e.target.src = PLACEHOLDER; }} loading="lazy"/>
                    <div className="continue-info">
                      <div className="continue-title">{item.title}</div>
                      <div className="continue-meta">Chapter {item.chapterNum} of {item.totalChapters}</div>
                      <div className="continue-progress-bar">
                        <div className="continue-progress-fill" style={{width:`${Math.round((item.chapterNum / Math.max(item.totalChapters,1)) * 100)}%`}}/>
                      </div>
                    </div>
                    <div className="continue-btn"><svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="home-section">
            <div className="section-title">
              <span>🔥</span> Trending
              <div className="trend-tabs">
                {[['today','Today'],['week','This Week'],['month','This Month'],['all','All Time']].map(([key,label]) => (
                  <button key={key} className={`trend-tab ${trendTab === key ? 'active' : ''}`} onClick={() => fetchTrendTab(key)}>{label}</button>
                ))}
              </div>
              <Link href="/browse?sort=views" className="section-see-all">See All →</Link>
            </div>
            <div className={isMobile ? 'scroll-row' : 'novel-grid novel-grid-4'}>
              {(loading || trendLoading)
                ? [...Array(4)].map((_,i) => <NovelCardSkeleton key={i}/>)
                : trending.length > 0
                  ? trending.map(n => <NovelCard key={n._id} novel={n}/>)
                  : <div style={{color:'var(--text-muted)',fontFamily:'var(--font-mono)',fontSize:'0.82rem',padding:'32px 0'}}>No novels in this period yet.</div>
              }
            </div>
          </section>

          <section className="home-section">
            <div className="section-title">
              <span>⭐</span> Top Rated
              <Link href="/rankings" className="section-see-all">See All →</Link>
            </div>
            <div className={isMobile ? 'scroll-row' : 'novel-grid novel-grid-4'}>
              {loading ? [...Array(4)].map((_,i) => <NovelCardSkeleton key={i}/>) : topRated.map((n,i) => <NovelCard key={n._id} novel={n} rank={i+1}/>)}
            </div>
          </section>

          <section className="home-section">
            <div className="section-title">
              <span>✨</span> Recently Added
              <Link href="/browse?sort=added" className="section-see-all">See All →</Link>
            </div>
            <div className="scroll-row">
              {loading ? [...Array(6)].map((_,i) => <NovelCardSkeleton key={i}/>) : recentlyAdded.map(n => <NovelCard key={n._id} novel={n}/>)}
            </div>
          </section>

          <LatestUpdates latestAll={latestAll} loading={loading} isMobile={isMobile}/>
        </div>
      </div>
    </PageLayout>
  );
}
