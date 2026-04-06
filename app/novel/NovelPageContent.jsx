'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getNovel, getNovelBySlug, getChapters, rateNovel } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import CommentSection from '@/components/CommentSection';
import AdBanner from '@/components/AdBanner';
import PageLayout from '@/components/PageLayout';
import './NovelPage.css';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=600&fit=crop';

// isBookmarked / toggleBookmark (localStorage)
function isBookmarked(id) {
  try { return JSON.parse(localStorage.getItem('ns_bookmarks') || '[]').some(b => b._id === id); }
  catch { return false; }
}
function toggleBookmark(novel) {
  try {
    const bm = JSON.parse(localStorage.getItem('ns_bookmarks') || '[]');
    const idx = bm.findIndex(b => b._id === novel._id);
    if (idx >= 0) { bm.splice(idx, 1); localStorage.setItem('ns_bookmarks', JSON.stringify(bm)); return false; }
    else { bm.unshift(novel); localStorage.setItem('ns_bookmarks', JSON.stringify(bm)); return true; }
  } catch { return false; }
}

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-picker">
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button" className={'star-pick' + (i <= (hover || value) ? ' lit' : '')}
          onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)} onClick={() => onChange(i)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function NovelPageContent() {
  const params   = useParams();
  const router   = useRouter();
  const { user } = useAuth();

  // Support both /novel/s/[slug] and /novel/[id]
  const slug = params.slug || null;
  const id   = params.id   || null;

  const [novel, setNovel]       = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab]   = useState('chapters');
  const [bookmarked, setBookmarked] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [ratingMsg, setRatingMsg]   = useState('');
  const [chapterSearch, setChapterSearch] = useState('');
  const [chapterPage, setChapterPage]     = useState(1);
  const [showAllTags, setShowAllTags]     = useState(false);
  const [showFullDesc, setShowFullDesc]   = useState(false);
  const CHAPTER_LIMIT = 30;
  const TAG_LIMIT = 5;
  const DESC_LIMIT = 300;

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const n = slug ? await getNovelBySlug(slug) : await getNovel(id);
        const chs = await getChapters(n._id);
        setNovel(n);
        setChapters(chs);
        setBookmarked(isBookmarked(n._id));
      } catch { router.push('/'); }
      finally { setLoading(false); }
    }
    load();
  }, [id, slug]);

  async function handleRate(rating) {
    if (!user) { setRatingMsg('Sign in to rate'); setTimeout(() => setRatingMsg(''), 2000); return; }
    setUserRating(rating);
    try {
      const res = await rateNovel(novel._id, rating);
      setNovel(n => ({ ...n, rating: res.rating, ratingCount: res.ratingCount }));
      setRatingMsg('Thanks for rating!');
      setTimeout(() => setRatingMsg(''), 2000);
    } catch { setRatingMsg('Could not submit rating'); }
  }

  const filteredChapters = chapters.filter(ch =>
    !chapterSearch || ch.title.toLowerCase().includes(chapterSearch.toLowerCase()) || String(ch.number).includes(chapterSearch)
  );
  const chapterTotalPages = Math.ceil(filteredChapters.length / CHAPTER_LIMIT);
  const pagedChapters = filteredChapters.slice((chapterPage - 1) * CHAPTER_LIMIT, chapterPage * CHAPTER_LIMIT);

  function chapterUrl(ch) {
    if (novel?.slug) return `/read/s/${novel.slug}/chapter-${ch.number}`;
    return `/read/${novel._id}/${ch.number}`;
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="novel-page">
          <div className="novel-banner"><div className="novel-banner-bg" style={{background:'var(--bg-secondary)'}}/><div className="novel-banner-overlay"/></div>
          <div className="container novel-layout" style={{marginTop:'-120px',position:'relative',zIndex:2}}>
            <div style={{display:'flex',flexDirection:'column',gap:'12px',paddingTop:'120px'}}>
              <div className="skeleton-cover" style={{width:'240px',aspectRatio:'3/4',borderRadius:'12px'}}/>
            </div>
            <div style={{paddingTop:'80px'}}>
              <div className="skeleton-line" style={{width:'60%',height:'2rem',marginBottom:'16px'}}/>
              <div className="skeleton-line" style={{width:'40%',marginBottom:'12px'}}/>
              <div className="skeleton-line" style={{width:'80%'}}/>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!novel) return null;
  const firstChapter = chapters.length > 0 ? chapters[0] : null;
  const novelUrl  = novel?.slug ? `/novel/s/${novel.slug}` : `/novel/${novel?._id}`;
  const novelDesc = novel?.description ? novel.description.slice(0, 155) : `Read ${novel?.title} by ${novel?.author} on idenwebstudio. ${chapters.length || novel?.chapterCount} chapters available.`;

  return (
    <PageLayout>
      <div className="novel-page">
        <div className="novel-banner">
          <img src={novel.cover || PLACEHOLDER} alt="" className="novel-banner-bg" onError={e => { e.target.src = PLACEHOLDER; }}/>
          <div className="novel-banner-overlay"/>
        </div>

        <div className="container novel-layout">
          <aside className="novel-sidebar">
            <div className="novel-cover-wrap">
              <img src={novel.cover || PLACEHOLDER} alt={novel.title} className="novel-main-cover" onError={e => { e.target.src = PLACEHOLDER; }}/>
              <div className="novel-cover-glow"/>
            </div>
            <div className="novel-sidebar-actions">
              {firstChapter ? (
                <Link href={chapterUrl(firstChapter)} className="btn-primary" style={{width:'100%',justifyContent:'center'}}>
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  Start Reading
                </Link>
              ) : (
                <button className="btn-primary" style={{width:'100%',justifyContent:'center',opacity:0.5}} disabled>No Chapters Yet</button>
              )}
              <button className={`btn-secondary bookmark-btn ${bookmarked ? 'bookmarked' : ''}`} onClick={() => {
                if (!novel) return;
                const added = toggleBookmark(novel);
                setBookmarked(added);
              }}>
                <svg width="16" height="16" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                {bookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>
            </div>
            <div className="rate-box">
              <div className="rate-box-label">Rate This Novel</div>
              <StarPicker value={userRating} onChange={handleRate}/>
              {ratingMsg && <div className="rate-msg">{ratingMsg}</div>}
            </div>
          </aside>

          <main className="novel-main">
            <div className="novel-header">
              <div className="novel-genres">
                {(novel.genres || []).map(g => (
                  <Link key={g} href={`/browse?genre=${g}`} className="hero-genre-tag">{g}</Link>
                ))}
                <span className={`badge badge-${novel.status}`}>{novel.status}</span>
              </div>
              <h1 className="novel-title">{novel.title}</h1>
              <div className="novel-stats-row">
                <div className="novel-stat">
                  <div className="novel-stat-value" style={{display:'flex',alignItems:'center',gap:'4px'}}>
                    {[1,2,3,4,5].map(i => (
                      <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i <= Math.floor(novel.rating) ? 'var(--accent-gold)' : 'var(--text-muted)'}>
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    ))}
                    <span style={{marginLeft:'4px',color:'var(--accent-gold)',fontFamily:'var(--font-mono)',fontSize:'0.85rem'}}>{novel.rating}</span>
                  </div>
                  <div className="novel-stat-label">Rating ({novel.ratingCount || 0})</div>
                </div>
                <div className="novel-stat-divider"/>
                <div className="novel-stat">
                  <div className="novel-stat-value">{novel.views?.toLocaleString()}</div>
                  <div className="novel-stat-label">Views</div>
                </div>
                <div className="novel-stat-divider"/>
                <div className="novel-stat">
                  <div className="novel-stat-value">{chapters.length || novel.chapterCount}</div>
                  <div className="novel-stat-label">Chapters</div>
                </div>
              </div>
              {(novel.tags || []).length > 0 && (
                <div className="novel-tags">
                  {(showAllTags ? novel.tags : novel.tags.slice(0, TAG_LIMIT)).map(t => (
                    <span key={t} className="genre-tag">{t}</span>
                  ))}
                  {novel.tags.length > TAG_LIMIT && (
                    <button className="tags-toggle-btn" onClick={() => setShowAllTags(s => !s)}>
                      {showAllTags ? 'Show less' : `+${novel.tags.length - TAG_LIMIT} more`}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="novel-description-block">
              {novel.description ? (() => {
                const full = novel.description;
                const truncated = full.length > DESC_LIMIT && !showFullDesc;
                const text = truncated ? full.slice(0, DESC_LIMIT).trimEnd() + '…' : full;
                return (
                  <>
                    {text.split(/\n+/).map((line, i) => line.trim() ? <p key={i}>{line.trim()}</p> : null)}
                    {full.length > DESC_LIMIT && (
                      <button className="tags-toggle-btn desc-toggle-btn" onClick={() => setShowFullDesc(s => !s)}>
                        {showFullDesc ? 'Show less' : 'Read more'}
                      </button>
                    )}
                  </>
                );
              })() : <p>No description provided.</p>}
            </div>

            <div className="novel-tabs">
              <button className={`novel-tab ${activeTab === 'chapters' ? 'active' : ''}`} onClick={() => setActiveTab('chapters')}>
                Chapters ({chapters.length})
              </button>
            </div>

            {activeTab === 'chapters' && (
              <div className="chapter-list">
                {chapters.length > 10 && (
                  <div className="chapter-search-bar">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    <input type="text" placeholder="Search chapters..." value={chapterSearch} onChange={e => { setChapterSearch(e.target.value); setChapterPage(1); }}/>
                  </div>
                )}
                <div className="chapter-list-header">
                  <span>Chapter</span><span>Title</span><span>Words</span><span>Date</span>
                </div>
                {filteredChapters.length === 0 && (
                  <div style={{padding:'32px',textAlign:'center',color:'var(--text-muted)',fontFamily:'var(--font-mono)',fontSize:'0.82rem'}}>
                    {chapters.length === 0 ? 'No chapters uploaded yet.' : 'No chapters match your search.'}
                  </div>
                )}
                {pagedChapters.map(ch => (
                  <Link key={ch._id} href={chapterUrl(ch)} className="chapter-item">
                    <span className="chapter-num">Ch. {ch.number}</span>
                    <span className="chapter-title-text">{ch.title}</span>
                    <span className="chapter-date">{(ch.wordCount || 0).toLocaleString()}w</span>
                    <span className="chapter-views">{new Date(ch.createdAt).toLocaleDateString()}</span>
                  </Link>
                ))}
                {chapterTotalPages > 1 && (
                  <div className="chapter-pagination">
                    <button className="ch-page-btn" disabled={chapterPage === 1} onClick={() => setChapterPage(p => p - 1)}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
                    </button>
                    {[...Array(chapterTotalPages)].map((_,i) => (
                      <button key={i} className={`ch-page-btn ${chapterPage === i+1 ? 'active' : ''}`} onClick={() => setChapterPage(i+1)}>{i+1}</button>
                    ))}
                    <button className="ch-page-btn" disabled={chapterPage === chapterTotalPages} onClick={() => setChapterPage(p => p + 1)}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                    <span className="ch-page-info">{(chapterPage-1)*CHAPTER_LIMIT+1}–{Math.min(chapterPage*CHAPTER_LIMIT, filteredChapters.length)} of {filteredChapters.length}</span>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>

        <div className="container" style={{padding:'0 0 8px'}}>
          <AdBanner slot="NOVEL_PAGE_AD_SLOT_ID" format="horizontal"/>
        </div>

        <div className="container" style={{paddingBottom:'80px'}}>
          <CommentSection novelId={novel._id}/>
        </div>
      </div>
    </PageLayout>
  );
}
