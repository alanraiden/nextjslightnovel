'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import PageLayout from '@/components/PageLayout';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=600&fit=crop';
const BOOKMARK_KEY = 'ns_bookmarks';

function getBookmarks() {
  try { return JSON.parse(localStorage.getItem(BOOKMARK_KEY) || '[]'); } catch { return []; }
}

const SORT_OPTIONS = [
  { value: 'recent',   label: 'Recently Added' },
  { value: 'title',    label: 'Title A–Z' },
  { value: 'chapters', label: 'Most Chapters' },
];

export default function BookmarksPage() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [sort,      setSort]      = useState('recent');
  const [search,    setSearch]    = useState('');
  const [removing,  setRemoving]  = useState(null);

  useEffect(() => { setBookmarks(getBookmarks()); }, []);

  function remove(novelId) {
    setRemoving(novelId);
    setTimeout(() => {
      const updated = getBookmarks().filter(b => b.novelId !== novelId);
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify(updated));
      setBookmarks(updated);
      setRemoving(null);
    }, 280);
  }

  const filtered = bookmarks
    .filter(b => !search || b.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'title')    return a.title.localeCompare(b.title);
      if (sort === 'chapters') return (b.chapterCount || 0) - (a.chapterCount || 0);
      return (b.savedAt || 0) - (a.savedAt || 0);
    });

  return (
    <PageLayout>
      <div style={{ padding: '40px 0 80px', minHeight: '100vh' }}>
        <div className="container">
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, marginBottom: '6px' }}>My Bookmarks</h1>
            <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
              {bookmarks.length} saved novel{bookmarks.length !== 1 ? 's' : ''}
            </p>
          </div>

          {!user && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <svg width="20" height="20" fill="none" stroke="var(--accent-purple)" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/></svg>
              <div>
                <div style={{ fontWeight: 600, marginBottom: '3px' }}>Sign in to sync bookmarks</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Your bookmarks are saved locally. Sign in to keep them across devices.</div>
              </div>
            </div>
          )}

          {bookmarks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🔖</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 600, marginBottom: '10px', color: 'var(--text-primary)' }}>No bookmarks yet</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', marginBottom: '28px' }}>
                Hit the Bookmark button on any novel page to save it here.
              </div>
              <Link href="/browse" className="btn-primary" style={{ display: 'inline-flex' }}>Browse Novels</Link>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '180px' }}>
                  <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  <input type="text" placeholder="Search bookmarks…" value={search} onChange={e => setSearch(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', paddingLeft: '32px', paddingRight: search ? '32px' : '12px', paddingTop: '9px', paddingBottom: '9px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', outline: 'none' }}
                  />
                  {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1 }}>×</button>}
                </div>
                <select value={sort} onChange={e => setSort(e.target.value)}
                  style={{ padding: '9px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', cursor: 'pointer', outline: 'none' }}>
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                  No bookmarks match "{search}".
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {filtered.map(b => {
                  const href = b.slug ? `/novel/s/${b.slug}` : `/novel/${b.novelId}`;
                  const isRemoving = removing === b.novelId;
                  return (
                    <div key={b.novelId} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', display: 'flex', transition: 'all 0.28s ease', opacity: isRemoving ? 0 : 1, transform: isRemoving ? 'scale(0.95)' : 'scale(1)' }}>
                      <Link href={href} style={{ textDecoration: 'none', flexShrink: 0 }}>
                        <img src={b.cover || PLACEHOLDER} alt={b.title} loading="lazy" onError={e => { e.target.src = PLACEHOLDER; }}
                          style={{ width: '80px', height: '110px', objectFit: 'cover', display: 'block' }} />
                      </Link>
                      <div style={{ flex: 1, padding: '12px 14px', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <Link href={href} style={{ textDecoration: 'none' }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '4px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {b.title}
                            </div>
                          </Link>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                            {b.chapterCount > 0 ? `Ch.${b.chapterCount}` : 'No chapters'}
                          </div>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            <span className={`badge badge-${b.status}`}>{b.status}</span>
                            {(b.genres || []).slice(0, 1).map(g => <span key={g} className="genre-tag">{g}</span>)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                          <Link href={href} className="btn-primary" style={{ fontSize: '0.72rem', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                            Read
                          </Link>
                          <button onClick={() => remove(b.novelId)}
                            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#ff6b6b'; e.currentTarget.style.color = '#ff6b6b'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filtered.length > 0 && (
                <div style={{ textAlign: 'center', marginTop: '32px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {filtered.length} of {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''}
                  {search && ` matching "${search}"`}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
