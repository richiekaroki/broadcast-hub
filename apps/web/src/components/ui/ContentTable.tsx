import { memo } from 'react';
import { ContentItem, ContentStatus } from '../../api';

interface ContentTableProps {
  items:   ContentItem[];
  loading: boolean;
}

const STATUS_CONFIG: Record<ContentStatus, { label: string; bg: string; color: string; border: string }> = {
  published:      { label: 'Published',      bg: 'rgba(34,197,94,0.1)',   color: '#22C55E', border: 'rgba(34,197,94,0.3)'   },
  pending_review: { label: 'Pending Review', bg: 'rgba(245,158,11,0.1)',  color: '#F59E0B', border: 'rgba(245,158,11,0.3)'  },
  draft:          { label: 'Draft',          bg: 'rgba(107,104,96,0.15)', color: '#9CA3AF', border: 'rgba(107,104,96,0.2)'  },
  rejected:       { label: 'Rejected',       bg: 'rgba(239,68,68,0.1)',   color: '#EF4444', border: 'rgba(239,68,68,0.3)'   },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'Just now';
  if (mins  < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function shortId(id: string): string {
  return `#BH-${id.slice(0, 4).toUpperCase()}`;
}

const COL: React.CSSProperties = {
  padding:  '14px 16px',
  fontSize: '13px',
  color:    'var(--color-text)',
  borderBottom: '1px solid var(--color-border)',
  verticalAlign: 'middle',
};

const TH: React.CSSProperties = {
  padding:       '10px 16px',
  fontSize:      '11px',
  color:         'var(--color-muted)',
  fontWeight:    500,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  textAlign:     'left',
  borderBottom:  '1px solid var(--color-border)',
};

export const ContentTable = memo(function ContentTable({ items, loading }: ContentTableProps) {
  return (
    <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Table header */}
      <div style={{ padding: '20px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '16px', color: 'var(--color-muted)' }}>⟳</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600, letterSpacing: '0.02em' }}>
            Recent Content
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" style={outlineBtn}>Export CSV</button>
          <button type="button" style={orangeBtn}>+ New Draft</button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <div className="table-wrapper"><table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              <th style={TH}>ID</th>
              <th style={TH}>Title</th>
              <th style={TH}>Status</th>
              <th style={TH}>Author</th>
              <th style={TH}>Created At</th>
              <th style={{ ...TH, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} style={COL}>
                      <div className="skeleton" style={{ height: 16, width: j === 1 ? 180 : 80 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ ...COL, textAlign: 'center', color: 'var(--color-muted)', padding: '40px' }}>
                  No content yet, create your first draft
                </td>
              </tr>
            ) : (
              items.map(item => {
                const cfg = STATUS_CONFIG[item.status];
                return (
                  <tr key={item.id} style={{ transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ ...COL, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                      {shortId(item.id)}
                    </td>
                    <td style={{ ...COL, maxWidth: '280px' }}>
                      <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px' }}>
                        {item.body.slice(0, 50)}…
                      </div>
                    </td>
                    <td style={COL}>
                      <span style={{
                        display:      'inline-flex',
                        alignItems:   'center',
                        gap:          '5px',
                        padding:      '3px 10px',
                        borderRadius: '20px',
                        fontSize:     '11px',
                        fontWeight:   600,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        background:   cfg.bg,
                        color:        cfg.color,
                        border:       `1px solid ${cfg.border}`,
                        whiteSpace:   'nowrap',
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
                        {cfg.label}
                      </span>
                    </td>
                    <td style={COL}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--color-orange), #c0392b)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '10px', fontWeight: 600, flexShrink: 0,
                        }}>
                          {item.authorId ? item.authorId.charAt(0).toUpperCase() : '?'}
</div>
                        <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
                          {item.authorId ? item.authorId.slice(0, 8) : 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td style={{ ...COL, color: 'var(--color-muted)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {relativeTime(item.createdAt)}
                    </td>
                    <td style={{ ...COL, textAlign: 'right' }}>
                      <button type="button" style={{
                        background: 'none', border: 'none',
                        color: 'var(--color-muted)', cursor: 'pointer',
                        fontSize: '18px', padding: '0 4px',
                        lineHeight: 1,
                      }} aria-label={`Actions for ${item.title}`}>⋮</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
</div>

      {/* Pagination footer */}
      <div style={{ padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)' }}>
        <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
          Showing 1 to {items.length} of {items.length} entries
        </span>
        <div style={{ display: 'flex', gap: '4px' }} role="navigation" aria-label="Pagination">
          {['‹', '1', '2', '3', '›'].map((p, i) => (
            <button type="button" key={i} aria-label={p === '1' ? 'Page 1, current page' : p === '‹' ? 'Previous page' : p === '›' ? 'Next page' : `Page ${p}`} aria-current={p === '1' ? 'page' : undefined} style={{
              width: 30, height: 30, borderRadius: '6px',
              border: '1px solid var(--color-border)',
              background: p === '1' ? 'var(--color-orange)' : 'transparent',
              color: p === '1' ? '#fff' : 'var(--color-muted)',
              fontSize: '13px', cursor: 'pointer',
              fontFamily: 'var(--font-body)',
            }}>{p}</button>
          ))}
        </div>
      </div>
    </div>
  );
});

const outlineBtn: React.CSSProperties = {
  padding:      '8px 16px',
  background:   'transparent',
  border:       '1px solid var(--color-border)',
  borderRadius: '6px',
  color:        'var(--color-text)',
  fontSize:     '13px',
  cursor:       'pointer',
  fontFamily:   'var(--font-body)',
};

const orangeBtn: React.CSSProperties = {
  padding:      '8px 16px',
  background:   'var(--color-orange)',
  border:       'none',
  borderRadius: '6px',
  color:        '#fff',
  fontSize:     '13px',
  fontWeight:   600,
  cursor:       'pointer',
  fontFamily:   'var(--font-body)',
};
