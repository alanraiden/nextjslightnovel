'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getNovels } from '@/services/api';
import PageLayout from '@/components/PageLayout';

const GENRES = ['Action','Adventure','Comedy','Drama','Fantasy','Harem','Historical','Horror','Isekai','Josei','Martial Arts','Mecha','Mystery','Psychological','Romance','School Life','Sci-Fi','Slice of Life','Sports','Supernatural','System','Tragedy','Wuxia','Xianxia','Xuanhuan'];
const EMOJIS = { Action:'⚔️', Adventure:'🗺️', Comedy:'😂', Drama:'🎭', Fantasy:'🧙', Historical:'📜', Horror:'👻', Isekai:'🌀', 'Martial Arts':'🥋', Mecha:'🤖', Mystery:'🔍', Psychological:'🧠', Romance:'💕', 'School Life':'🏫', 'Sci-Fi':'🚀', 'Slice of Life':'🌸', Sports:'⚽', Supernatural:'👁️', System:'⚙️', Tragedy:'💔', Wuxia:'🐉', Xianxia:'☁️', Xuanhuan:'✨' };

export default function GenresPage() {
  const [counts, setCounts]   = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all(
      GENRES.map(g => getNovels({ genre: g, limit: 1 }).then(d => [g, d.total || 0]).catch(() => [g, 0]))
    ).then(results => {
      setCounts(Object.fromEntries(results));
      setLoading(false);
    });
  }, []);

  return (
    <PageLayout>
      <div style={{padding:'40px 0 80px', minHeight:'100vh'}}>
        <div className="container">
          <h1 style={{fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:700, marginBottom:'8px'}}>Genres</h1>
          <p style={{color:'var(--text-muted)', fontFamily:'var(--font-mono)', fontSize:'0.82rem', marginBottom:'40px'}}>Browse novels by genre</p>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(170px, 1fr))', gap:'16px'}}>
            {GENRES.map(g => (
              <Link key={g} href={`/browse?genre=${encodeURIComponent(g)}`} style={{textDecoration:'none'}}>
                <div style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'24px 20px', transition:'all 0.25s ease', textAlign:'center',
                  cursor:'pointer'}}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='var(--border-accent)'; e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 16px 32px rgba(139,92,246,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}>
                  <div style={{fontSize:'2rem', marginBottom:'12px'}}>{EMOJIS[g] || '📖'}</div>
                  <div style={{fontFamily:'var(--font-display)', fontSize:'0.88rem', fontWeight:600, color:'var(--text-primary)', marginBottom:'6px'}}>{g}</div>
                  <div style={{fontFamily:'var(--font-mono)', fontSize:'0.7rem', color:'var(--text-muted)'}}>
                    {loading ? '...' : `${counts[g] || 0} novel${counts[g] !== 1 ? 's' : ''}`}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
