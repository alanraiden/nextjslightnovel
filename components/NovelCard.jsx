'use client';

import Link from 'next/link';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=600&fit=crop';

function isRecentlyUpdated(novel) {
  const updated = novel.updatedAt || novel.createdAt;
  if (!updated) return false;
  return Date.now() - new Date(updated).getTime() < 3 * 24 * 60 * 60 * 1000;
}

export default function NovelCard({ novel, rank, eager }) {
  const id   = novel._id || novel.id;
  const href = novel.slug ? `/novel/s/${novel.slug}` : `/novel/${id}`;
  const showUpdate   = isRecentlyUpdated(novel);
  const showOriginal = !!novel.isOriginal;
  const chapterLabel = novel.chapterCount > 0 ? `Ch.${novel.chapterCount}` : 'No chapters';

  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div className="novel-card">
        <div className="novel-card-cover">
          <img
            src={novel.cover || PLACEHOLDER}
            alt={novel.title}
            loading={eager ? 'eager' : 'lazy'}
            onError={e => { e.target.src = PLACEHOLDER; }}
          />
          <div className="novel-card-overlay">
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
              {novel.chapterCount || 0} chapters
            </span>
          </div>
          <div className="novel-card-status">
            <span className={`badge badge-${novel.status}`}>
              {novel.status === 'ongoing' ? '● ' : '✓ '}{novel.status}
            </span>
          </div>
          {showOriginal && !rank && <div className="novel-card-original-badge">ORIGINAL</div>}
          {rank && <div className="novel-card-rank">#{rank}</div>}
          {showUpdate && <div className="novel-card-update-badge">UPDATE</div>}
        </div>

        <div className="novel-card-info">
          <div className="novel-card-title">{novel.title}</div>
          <div className="novel-card-chapter-label">
            {showOriginal && <span className="novel-card-original-inline">✦ Original</span>}
            <span>{chapterLabel}</span>
          </div>
          <div className="novel-card-meta">
            <div className="novel-card-rating">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              {novel.rating || '0.0'}
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
              {typeof novel.views === 'number' ? novel.views.toLocaleString() : novel.views || '0'}
            </span>
          </div>
          <div className="novel-card-genres">
            {(novel.genres || []).slice(0, 2).map(g => (
              <span key={g} className="genre-tag">{g}</span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
