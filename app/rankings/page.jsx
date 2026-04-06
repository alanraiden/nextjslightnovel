'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getNovels } from '@/services/api';
import PageLayout from '@/components/PageLayout';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=600&fit=crop';
const TABS = ['Top Rated', 'Most Viewed', 'Most Chapters'];
const SORT_MAP = { 'Top Rated': 'rating', 'Most Viewed': 'views', 'Most Chapters': 'chapters' };

export default function RankingsPage() {
  const [tab, setTab]       = useState('Top Rated');
  const [novels, setNovels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getNovels({ sort: SORT_MAP[tab], limit: 20 })
      .then(d => setNovels(d.novels || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab]);

  const medalColor = i => i === 0 ? 'var(--accent-gold)' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'var(--text-muted)';

  return (
    <PageLayout>
      <div style={{padding:'40px 0 80px', minHeight:'100vh'}}>
        <div className="container">
          <h1 style={{fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:700, marginBottom:'8px'}}>Rankings</h1>
          <p style={{color:'var(--text-muted)', fontFamily:'var(--font-mono)', fontSize:'0.82rem', marginBottom:'28px'}}>Top novels on idenwebstudio</p>

          <div style={{display:'flex', gap:'4px', borderBottom:'1px solid var(--border)', marginBottom:'28px'}}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding:'10px 20px', background:'transparent', border:'none',
                borderBottom: t === tab ? '2px solid var(--accent-orange)' : '2px solid transparent',
                marginBottom:'-1px', color: t === tab ? 'var(--accent-orange)' : 'var(--text-secondary)',
                fontFamily:'var(--font-mono)', fontSize:'0.82rem', cursor:'pointer', transition:'color 0.2s'
              }}>{t}</button>
            ))}
          </div>

          <div style={{display:'flex', flexDirection:'column', gap:'2px'}}>
            {loading
              ? [...Array(10)].map((_,i) => (
                  <div key={i} style={{height:'80px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', animation:'shimmer 1.5s infinite', backgroundSize:'200% 100%', backgroundImage:'linear-gradient(90deg,var(--bg-elevated) 25%,var(--bg-card) 50%,var(--bg-elevated) 75%)'}} />
                ))
              : novels.map((n, i) => (
                  <Link key={n._id} href={n.slug ? `/novel/s/${n.slug}` : `/novel/${n._id}`} style={{textDecoration:'none'}}>
                    <div style={{
                      display:'grid', gridTemplateColumns:'56px 62px 1fr auto',
                      alignItems:'center', gap:'16px', padding:'14px 20px',
                      background:'var(--bg-card)', border:'1px solid var(--border)',
                      borderRadius:'var(--radius)', transition:'all 0.2s',
                    }}>
                      <span style={{fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:700, color: medalColor(i), textAlign:'center'}}>
                        {i < 3 ? ['🥇','🥈','🥉'][i] : `#${i+1}`}
                      </span>
                      <img src={n.cover || PLACEHOLDER} alt={n.title} style={{width:'46px',height:'62px',objectFit:'cover',borderRadius:'4px',display:'block'}}
                        onError={e => { e.target.src = PLACEHOLDER; }} />
                      <div>
                        <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px', flexWrap:'wrap'}}>
                          <span style={{fontFamily:'var(--font-display)', fontSize:'0.9rem', fontWeight:600, color:'var(--text-primary)'}}>{n.title}</span>
                          {n.isOriginal && <span style={{background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'white', fontSize:'0.58rem', fontWeight:700, fontFamily:'var(--font-mono)', letterSpacing:'0.1em', padding:'2px 6px', borderRadius:'4px', flexShrink:0}}>ORIGINAL</span>}
                        </div>
                        <div style={{display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap'}}>
                          <span style={{color:'var(--text-muted)', fontSize:'0.78rem', fontFamily:'var(--font-mono)'}}>
                            {n.chapterCount > 0 ? `Ch.${n.chapterCount}` : 'No chapters'}
                          </span>
                          {(n.genres||[]).slice(0,2).map(g => <span key={g} className="genre-tag">{g}</span>)}
                          <span className={`badge badge-${n.status}`}>{n.status}</span>
                        </div>
                      </div>
                      <div style={{textAlign:'right', flexShrink:0}}>
                        {tab === 'Top Rated'     && <div style={{color:'var(--accent-gold)', fontFamily:'var(--font-mono)', fontSize:'1.1rem', fontWeight:700}}>⭐ {n.rating}</div>}
                        {tab === 'Most Viewed'   && <div style={{color:'var(--accent-blue)', fontFamily:'var(--font-mono)', fontSize:'1.1rem', fontWeight:700}}>{n.views?.toLocaleString()} views</div>}
                        {tab === 'Most Chapters' && <div style={{color:'var(--accent-purple)', fontFamily:'var(--font-mono)', fontSize:'1.1rem', fontWeight:700}}>{n.chapterCount} ch</div>}
                        <div style={{color:'var(--text-muted)', fontSize:'0.7rem', fontFamily:'var(--font-mono)', marginTop:'4px'}}>{n.ratingCount || 0} ratings</div>
                      </div>
                    </div>
                  </Link>
                ))
            }
            {!loading && novels.length === 0 && (
              <div style={{textAlign:'center', padding:'60px', color:'var(--text-muted)', fontFamily:'var(--font-mono)'}}>
                No novels yet. Be the first to publish!
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
