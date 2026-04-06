'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import NovelCard from '@/components/NovelCard';
import { getNovels } from '@/services/api';
import PageLayout from '@/components/PageLayout';
import './Browse.css';

const GENRES = ['Action','Adventure','Comedy','Drama','Fantasy','Harem','Historical','Horror','Isekai','Josei','Martial Arts','Mecha','Mystery','Psychological','Romance','School Life','Sci-Fi','Slice of Life','Sports','Supernatural','System','Tragedy','Wuxia','Xianxia','Xuanhuan'];

function NovelCardSkeleton() {
  return (
    <div className="novel-card" style={{pointerEvents:'none'}}>
      <div style={{aspectRatio:'3/4',background:'linear-gradient(90deg,var(--bg-elevated) 25%,var(--bg-card) 50%,var(--bg-elevated) 75%)',backgroundSize:'200% 100%',animation:'shimmer 1.5s infinite',borderRadius:'var(--radius-lg)'}}/>
      <div style={{padding:'14px',display:'flex',flexDirection:'column',gap:'8px'}}>
        <div style={{height:'12px',width:'80%',background:'var(--bg-elevated)',borderRadius:'4px'}}/>
        <div style={{height:'10px',width:'50%',background:'var(--bg-elevated)',borderRadius:'4px'}}/>
      </div>
    </div>
  );
}

function BrowseContent() {
  const searchParams = useSearchParams();
  const [search, setSearch]     = useState(searchParams.get('q')     || '');
  const [genre, setGenre]       = useState(searchParams.get('genre') || '');
  const [status, setStatus]     = useState('');
  const [sort, setSort]         = useState(searchParams.get('sort')  || 'rating');
  const [novels, setNovels]     = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [showGenres, setShowGenres] = useState(false);
  const LIMIT = 24;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { sort, limit: LIMIT, page };
      if (search) params.search = search;
      if (genre)  params.genre  = genre;
      if (status) params.status = status;
      const data = await getNovels(params);
      setNovels(data.novels || []);
      setTotal(data.total   || 0);
    } catch {}
    setLoading(false);
  }, [search, genre, status, sort, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="browse-page">
      <div className="container">
        <div className="browse-header">
          <h1 className="browse-title">Browse Novels</h1>
          <p className="browse-subtitle">{loading ? 'Loading...' : `${total} novels found`}</p>
        </div>

        <div className="browse-bar">
          <div className="browse-search-wrap">
            <div className="browse-search">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input type="text" placeholder="Search novels..." value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                onKeyDown={e => e.key === 'Enter' && load()}
              />
            </div>
          </div>

          <div className="browse-sort-tabs">
            {[['rating','⭐ Top Rated'],['views','🔥 Most Viewed'],['new','🕐 Newest'],['chapters','📖 Chapters']].map(([v,l]) => (
              <button key={v} className={`browse-sort-tab ${sort===v?'active':''}`} onClick={() => { setSort(v); setPage(1); }}>{l}</button>
            ))}
          </div>

          <div className="browse-status-pills">
            {[['','All'],['ongoing','Ongoing'],['completed','Done']].map(([v,l]) => (
              <button key={v} className={`browse-pill ${status===v?'active':''}`} onClick={() => { setStatus(v); setPage(1); }}>{l}</button>
            ))}
          </div>

          <button className={`browse-genre-toggle ${genre?'has-filter':''}`} onClick={() => setShowGenres(s => !s)}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
            {genre || 'Genre'}
            {genre && <span className="browse-clear-x" onClick={e => { e.stopPropagation(); setGenre(''); setPage(1); }}>✕</span>}
          </button>
        </div>

        {showGenres && (
          <div className="browse-genre-row">
            <button className={`genre-chip ${!genre?'active':''}`} onClick={() => { setGenre(''); setPage(1); setShowGenres(false); }}>All</button>
            {GENRES.map(g => (
              <button key={g} className={`genre-chip ${genre===g?'active':''}`} onClick={() => { setGenre(g===genre?'':g); setPage(1); setShowGenres(false); }}>{g}</button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="browse-grid">{[...Array(12)].map((_,i) => <NovelCardSkeleton key={i}/>)}</div>
        ) : novels.length === 0 ? (
          <div className="browse-empty">
            <div style={{fontSize:'3rem',marginBottom:'16px'}}>📭</div>
            <div style={{fontFamily:'var(--font-display)',fontSize:'1.1rem',marginBottom:'8px'}}>No novels found</div>
            <div style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>Try adjusting your filters</div>
          </div>
        ) : (
          <>
            <div className="browse-grid">{novels.map(n => <NovelCard key={n._id} novel={n}/>)}</div>
            {totalPages > 1 && (
              <div className="pagination">
                <button className="page-btn" disabled={page===1} onClick={() => setPage(p => p-1)}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                {[...Array(Math.min(totalPages,7))].map((_,i) => (
                  <button key={i+1} className={`page-btn ${page===i+1?'active':''}`} onClick={() => setPage(i+1)}>{i+1}</button>
                ))}
                {totalPages > 7 && <span style={{color:'var(--text-muted)',padding:'0 4px',alignSelf:'center'}}>...</span>}
                {totalPages > 7 && <button className={`page-btn ${page===totalPages?'active':''}`} onClick={() => setPage(totalPages)}>{totalPages}</button>}
                <button className="page-btn" disabled={page===totalPages} onClick={() => setPage(p => p+1)}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <PageLayout>
      <Suspense fallback={<div style={{padding:'60px',textAlign:'center',color:'var(--text-muted)'}}>Loading...</div>}>
        <BrowseContent />
      </Suspense>
    </PageLayout>
  );
}
