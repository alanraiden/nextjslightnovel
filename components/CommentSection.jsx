'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getComments, addComment, deleteComment, likeComment } from '../services/api';
import './CommentSection.css';

const PLACEHOLDER_AVATAR = 'https://api.dicebear.com/7.x/initials/svg?seed=';

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)      return 'just now';
  if (diff < 3600)    return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400)   return Math.floor(diff / 3600) + 'h ago';
  if (diff < 2592000) return Math.floor(diff / 86400) + 'd ago';
  return new Date(date).toLocaleDateString();
}

export default function CommentSection({ novelId, chapterNum }) {
  const { user } = useAuth();
  const [comments, setComments]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [posting, setPosting]     = useState(false);
  const [text, setText]           = useState('');
  const [error, setError]         = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { loadComments(1); }, [novelId, chapterNum]);

  async function loadComments(p = 1) {
    setLoading(true);
    try {
      const data = await getComments(novelId, p, chapterNum);
      if (p === 1) setComments(data.comments);
      else setComments(prev => [...prev, ...data.comments]);
      setTotal(data.total);
      setPage(p);
    } catch {}
    setLoading(false);
  }

  async function handlePost(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true); setError('');
    try {
      const comment = await addComment(novelId, text.trim(), chapterNum);
      setComments(prev => [comment, ...prev]);
      setTotal(t => t + 1);
      setText('');
    } catch (err) { setError(err.message); }
    setPosting(false);
  }

  async function handleDelete(commentId) {
    try {
      await deleteComment(novelId, commentId);
      setComments(prev => prev.filter(c => c._id !== commentId));
      setTotal(t => t - 1);
      setDeleteConfirm(null);
    } catch (err) { setError(err.message); }
  }

  async function handleLike(commentId) {
    if (!user) return;
    try {
      const res = await likeComment(novelId, commentId);
      setComments(prev => prev.map(c =>
        c._id === commentId ? { ...c, likes: Array(res.likes).fill(null), _liked: res.liked } : c
      ));
    } catch {}
  }

  return (
    <div className="comment-section">
      <div className="comment-header">
        <h3 className="comment-title">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {chapterNum != null ? `Chapter ${chapterNum} Comments` : 'Comments'}
          <span className="comment-count">{total}</span>
        </h3>
      </div>

      {user ? (
        <form className="comment-form" onSubmit={handlePost}>
          <div className="comment-form-avatar">
            {user.avatar
              ? <img src={user.avatar} alt={user.name} referrerPolicy="no-referrer" />
              : <img src={PLACEHOLDER_AVATAR + encodeURIComponent(user.name)} alt={user.name} />
            }
          </div>
          <div className="comment-form-body">
            <textarea placeholder="Write a comment..." value={text} onChange={e => setText(e.target.value)} maxLength={1000} rows={3}/>
            <div className="comment-form-footer">
              <span className="char-count">{text.length}/1000</span>
              {error && <span className="comment-error">{error}</span>}
              <button type="submit" className="comment-post-btn" disabled={posting || !text.trim()}>
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="comment-login-prompt">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Sign in to leave a comment
        </div>
      )}

      <div className="comments-list">
        {loading && comments.length === 0 ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="comment-skeleton">
              <div className="skeleton-avatar" />
              <div className="skeleton-body">
                <div className="skeleton-line" style={{width:'30%'}} />
                <div className="skeleton-line" style={{width:'80%'}} />
                <div className="skeleton-line" style={{width:'60%'}} />
              </div>
            </div>
          ))
        ) : comments.length === 0 ? (
          <div className="comments-empty">No comments yet. Be the first to comment!</div>
        ) : (
          comments.map(comment => (
            <div key={comment._id} className="comment-item">
              <div className="comment-avatar">
                {comment.userAvatar
                  ? <img src={comment.userAvatar} alt={comment.userName} referrerPolicy="no-referrer" />
                  : <img src={PLACEHOLDER_AVATAR + encodeURIComponent(comment.userName)} alt={comment.userName} />
                }
              </div>
              <div className="comment-body">
                <div className="comment-meta">
                  <span className="comment-user">{comment.userName}</span>
                  <span className="comment-time">{timeAgo(comment.createdAt)}</span>
                  {(user?.role === 'admin' || user?.id === comment.userId) && (
                    <button className="comment-delete-btn" onClick={() => setDeleteConfirm(comment._id)} title="Delete comment">
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  )}
                </div>
                <p className="comment-text">{comment.text}</p>
                <div className="comment-actions">
                  <button className={`comment-like-btn ${comment._liked ? 'liked' : ''}`} onClick={() => handleLike(comment._id)} disabled={!user}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill={comment._liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    {comment.likes?.length || 0}
                  </button>
                </div>
              </div>
              {deleteConfirm === comment._id && (
                <div className="comment-delete-confirm">
                  <span>Delete this comment?</span>
                  <button className="confirm-yes" onClick={() => handleDelete(comment._id)}>Delete</button>
                  <button className="confirm-no" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {comments.length < total && (
        <button className="load-more-btn" onClick={() => loadComments(page + 1)} disabled={loading}>
          {loading ? 'Loading...' : `Load more (${total - comments.length} remaining)`}
        </button>
      )}
    </div>
  );
}
