import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MobileSidebar } from '../../components/MobileSidebar';
import { toast } from '../../components/Toast';
import { useAppSelector } from '../../store/hooks';
import {
  fetchContent, createContent, updateContent,
  submitContent, publishContent, rejectContent, deleteContent,
  ContentItem, ContentStatus,
} from '../../api/client';


// ── Status config ──────────────────────────────────────────────────────────────
const STATUS: Record<ContentStatus, { label: string; cls: string }> = {
  published:      { label: 'Published', cls: 'badge status-published' },
  pending_review: { label: 'Pending',   cls: 'badge status-pending'   },
  draft:          { label: 'Draft',     cls: 'badge status-draft'     },
  rejected:       { label: 'Rejected',  cls: 'badge status-rejected'  },
};

// ── Create/Edit modal ─────────────────────────────────────────────────────────
function ContentModal({
  item, onClose,
}: {
  item?: ContentItem | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(item?.title ?? '');
  const [body,  setBody]  = useState(item?.body  ?? '');

  const create = useMutation({
    mutationFn: () => createContent({ title, body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content-all'] });
      toast.success('Draft created', title);
      onClose();
    },
    onError: (e: Error) => toast.error('Failed to create', e.message),
  });

  const update = useMutation({
    mutationFn: () => updateContent(item!.id, { title, body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content-all'] });
      toast.success('Content updated');
      onClose();
    },
    onError: (e: Error) => toast.error('Failed to update', e.message),
  });

  const isEdit    = !!item;
  const isPending = create.isPending || update.isPending;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="card anim-scale-in" style={{ width: '100%', maxWidth: '560px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 600 }}>
            {isEdit ? 'Edit Draft' : 'New Draft'}
          </span>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '18px' }}>✕</button>
        </div>

        <label style={labelSt}>Title</label>
        <input
          className="input"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Article title…"
          style={{ marginBottom: '14px' }}
        />

        <label style={labelSt}>Body</label>
        <textarea
          className="input"
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Write your content here…"
          rows={8}
          style={{ resize: 'vertical', marginBottom: '20px' }}
        />

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button"
            className="btn-primary"
            disabled={!title.trim() || !body.trim() || isPending}
            onClick={() => isEdit ? update.mutate() : create.mutate()}
            style={{ opacity: isPending ? 0.6 : 1 }}
          >
            {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create draft'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reject modal ──────────────────────────────────────────────────────────────
function RejectModal({ id, onClose }: { id: string; onClose: () => void }) {
  const qc      = useQueryClient();
  const [reason, setReason] = useState('');
  const reject  = useMutation({
    mutationFn: () => rejectContent(id, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content-all'] }); toast.warning('Content rejected'); onClose(); },
    onError: (e: Error) => toast.error('Failed', e.message),
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="card anim-scale-in" style={{ width: '100%', maxWidth: '400px', padding: '24px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--red)' }}>
          Reject Content
        </div>
        <label style={labelSt}>Reason</label>
        <textarea className="input" value={reason} onChange={e => setReason(e.target.value)} placeholder="Explain why this is being rejected…" rows={4} style={{ resize: 'none', marginBottom: '16px' }} />
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary" disabled={!reason.trim() || reject.isPending} onClick={() => reject.mutate()} style={{ background: 'var(--red)', opacity: reject.isPending ? 0.6 : 1 }}>
            {reject.isPending ? 'Rejecting…' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function ContentPage() {
  const qc              = useQueryClient();
  const { userRole }    = useAppSelector(s => s.auth);
  const isAdmin         = userRole?.includes('super_admin') || userRole?.includes('admin');
  const isEditor        = isAdmin || userRole?.includes('editor');

  const [modal,    setModal]    = useState<'create' | 'edit' | null>(null);
  const [editing,  setEditing]  = useState<ContentItem | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [filter,   setFilter]   = useState<ContentStatus | 'all'>('all');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['content-all'],
    queryFn:  fetchContent,
  });

  const submitMut = useMutation({
    mutationFn: submitContent,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content-all'] }); toast.info('Submitted for review'); },
    onError: (e: Error) => toast.error('Submit failed', e.message),
  });

  const publishMut = useMutation({
    mutationFn: publishContent,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content-all'] }); toast.success('Published!'); },
    onError: (e: Error) => toast.error('Publish failed', e.message),
  });

  const deleteMut = useMutation({
    mutationFn: deleteContent,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content-all'] }); toast.success('Deleted'); },
    onError: (e: Error) => toast.error('Delete failed', e.message),
  });

  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter);
  const counts   = {
    all:            items.length,
    draft:          items.filter(i => i.status === 'draft').length,
    pending_review: items.filter(i => i.status === 'pending_review').length,
    published:      items.filter(i => i.status === 'published').length,
    rejected:       items.filter(i => i.status === 'rejected').length,
  };

  function relTime(iso: string) {
    const d = Date.now() - new Date(iso).getTime(), m = Math.floor(d/60000), h = Math.floor(d/3600000), days = Math.floor(d/86400000);
    return m < 1 ? 'Just now' : m < 60 ? `${m}m ago` : h < 24 ? `${h}h ago` : `${days}d ago`;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <MobileSidebar activeItem="content" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <header style={{ height: '52px', background: 'var(--bg-raised)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between', gap: '12px', position: 'sticky', top: 0, zIndex: 10 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, letterSpacing: '0.03em' }}>Content</span>
          {isEditor && (
            <button type="button" className="btn-primary" style={{ padding: '7px 14px', fontSize: '12px' }}
              onClick={() => { setEditing(null); setModal('create'); }}>
              + New Draft
            </button>
          )}
        </header>

        <main style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {(['all', 'draft', 'pending_review', 'published', 'rejected'] as const).map(f => (
              <button type="button" key={f} onClick={() => setFilter(f)} style={{
                padding: '5px 12px', borderRadius: '20px', border: '1px solid',
                borderColor: filter === f ? 'var(--orange)' : 'var(--border)',
                background:  filter === f ? 'var(--orange-dim)' : 'transparent',
                color:       filter === f ? 'var(--orange)' : 'var(--text-secondary)',
                fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-body)',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: '5px',
              }}>
                {f === 'all' ? 'All' : f.replace('_', ' ')}
                <span style={{ fontSize: '10px', opacity: 0.8 }}>{counts[f]}</span>
              </button>
            ))}
          </div>

          {/* Content cards — mobile-first grid */}
          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card" style={{ padding: '16px' }}>
                  <div className="skeleton" style={{ height: 14, width: '70%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 11, width: '40%', marginBottom: 14 }} />
                  <div className="skeleton" style={{ height: 11, width: '90%', marginBottom: 6 }} />
                  <div className="skeleton" style={{ height: 11, width: '80%' }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📄</div>
              <div style={{ fontSize: '14px' }}>No content found</div>
              {isEditor && <div style={{ fontSize: '12px', marginTop: '6px' }}>Create a new draft to get started</div>}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
              {filtered.map((item, i) => {
                const cfg = STATUS[item.status];
                return (
                  <div key={item.id} className={`card card-lift anim-slide-up d-${Math.min(i, 7)}`} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '3px' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{relTime(item.createdAt)}</div>
                      </div>
                      <span className={cfg.cls} style={{ flexShrink: 0 }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                        {cfg.label}
                      </span>
                    </div>

                    {/* Body preview */}
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                      {item.body}
                    </p>

                    {/* Rejection reason */}
                    {item.status === 'rejected' && item.rejectionReason && (
                      <div style={{ fontSize: '11px', color: 'var(--red)', background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--r-sm)', padding: '6px 10px' }}>
                        ⚠ {item.rejectionReason}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', flexWrap: 'wrap' }}>
                      {/* Editor actions */}
                      {isEditor && item.status === 'draft' && (
                        <>
                          <button type="button" className="btn-ghost" style={{ flex: 1, fontSize: '11px', padding: '6px', justifyContent: 'center' }}
                            onClick={() => { setEditing(item); setModal('edit'); }}>
                            Edit
                          </button>
                          <button type="button" className="btn-primary" style={{ flex: 1, fontSize: '11px', padding: '6px', justifyContent: 'center' }}
                            onClick={() => submitMut.mutate(item.id)}>
                            Submit
                          </button>
                        </>
                      )}

                      {/* Admin actions */}
                      {isAdmin && item.status === 'pending_review' && (
                        <>
                          <button type="button" className="btn-primary" style={{ flex: 1, fontSize: '11px', padding: '6px', justifyContent: 'center' }}
                            onClick={() => publishMut.mutate(item.id)}>
                            Publish
                          </button>
                          <button type="button" className="btn-ghost" style={{ flex: 1, fontSize: '11px', padding: '6px', justifyContent: 'center', color: 'var(--red)', borderColor: 'rgba(239,68,68,0.3)' }}
                            onClick={() => setRejecting(item.id)}>
                            Reject
                          </button>
                        </>
                      )}

                      {/* Delete — admin only */}
                      {isAdmin && item.status !== 'published' && (
                        <button type="button" className="btn-ghost" style={{ fontSize: '11px', padding: '6px 10px', color: 'var(--text-tertiary)' }}
                          onClick={() => { if (confirm(`Delete "${item.title}"?`)) deleteMut.mutate(item.id); }}>
                          🗑
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {(modal === 'create' || modal === 'edit') && (
        <ContentModal item={modal === 'edit' ? editing : null} onClose={() => { setModal(null); setEditing(null); }} />
      )}
      {rejecting && <RejectModal id={rejecting} onClose={() => setRejecting(null)} />}
    </div>
  );
}

const labelSt: React.CSSProperties = {
  display: 'block', fontSize: '10px', color: 'var(--text-tertiary)',
  textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500,
  marginBottom: '6px',
};
