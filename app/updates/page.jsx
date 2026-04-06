'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getNovels } from '@/services/api';
import PageLayout from '@/components/PageLayout';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=600&fit=crop';

export default function UpdatesPage() {
  const [novels, setNovels]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNovels({ sort: 'new', limit: 30 })
      .then(d => setNovels(d.novels || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageLayout>
      <div style={{padding:'40px 0 80px', minHeight:'100vh'}}>
        <div className="container">
          <h1 style={{fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:700, marginBottom:'8px'}}>Latest Updates</h1>
          <p style={{color:'var(--text-muted)', fontFamily:'var(--font-mono)', fontSize:'0.82rem', marginBottom:'32px'}}>Most recently updated novels</p>

          <div style={{display:'flex', flexDirection:'column', gap:'2px'}}>
            {loading
              ? [...Array(8)].map((_,i) => (
                  <div key={i} style={{height:'90px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', backgroundImage:'linear-gradient(90deg,var(--bg-elevated) 25%,var(--bg-card) 50%,var(--bg-elevated) 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite'}} />
                ))
              : novels.map(n => (
                  <div key={n._id} style={{display:'grid', gridTemplateColumns:'60px 1fr auto', alignItems:'center', gap:'16px', padding:'14px 20px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', transition:'all 0.2s'}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-accent)'; e.currentTarget.style.background='var(--bg-elevated)';}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--bg-card)';}}>
                    <Link href={n.slug ? `/novel/s/${n.slug}` : `/novel/${n._id}`}>
                      <img src={n.cover||PLACEHOLDER} alt={n.title} style={{width:'46px',height:'62px',objectFit:'cover',borderRadius:'4px',display:'block'}}
                        onError={e=>{e.target.src=PLACEHOLDER;}} />
                    </Link>
                    <div>
                      <Link href={n.slug ? `/novel/s/${n.slug}` : `/novel/${n._id}`} style={{textDecoration:'none'}}>
                        <div style={{fontFamily:'var(--font-display)', fontSize:'0.9rem', fontWeight:600, color:'var(--text-primary)', marginBottom:'4px'}}>{n.title}</div>
                      </Link>
                      <div style={{color:'var(--accent-blue)', fontFamily:'var(--font-mono)', fontSize:'0.75rem', marginBottom:'4px'}}>
                        {n.chapterCount} chapter{n.chapterCount !== 1 ? 's' : ''} total
                      </div>
                      <div style={{display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap'}}>
                        <span style={{color:'var(--text-muted)', fontSize:'0.72rem'}}>by {n.author}</span>
                        {(n.genres||[]).slice(0,1).map(g=><span key={g} className="genre-tag">{g}</span>)}
                      </div>
                    </div>
                    <div style={{textAlign:'right', flexShrink:0}}>
                      <div style={{fontFamily:'var(--font-mono)', fontSize:'0.72rem', color:'var(--text-muted)', marginBottom:'6px'}}>
                        {new Date(n.updatedAt).toLocaleDateString()}
                      </div>
                      <span className={`badge badge-${n.status}`}>{n.status}</span>
                    </div>
                  </div>
                ))
            }
            {!loading && novels.length === 0 && (
              <div style={{textAlign:'center', padding:'60px', color:'var(--text-muted)', fontFamily:'var(--font-mono)'}}>No novels yet.</div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
