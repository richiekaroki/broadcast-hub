interface CacheIndicatorProps { cached: boolean | null; }

export function CacheIndicator({ cached }: CacheIndicatorProps) {
  if (cached === null) return null;
  return (
    <div style={{
      display:       'inline-flex',
      alignItems:    'center',
      gap:           '6px',
      padding:       '4px 10px',
      borderRadius:  '20px',
      fontSize:      '10px',
      fontFamily:    'var(--font-mono)',
      fontWeight:    500,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      background:    cached ? 'var(--green-dim)' : 'rgba(255,255,255,0.04)',
      border:        `1px solid ${cached ? 'rgba(34,197,94,0.25)' : 'var(--border)'}`,
      color:         cached ? 'var(--green)' : 'var(--text-tertiary)',
      whiteSpace:    'nowrap',
      transition:    'all 0.3s ease',
    }}>
      <span className={cached ? 'live-dot' : ''} style={{
        width: 5, height: 5, borderRadius: '50%',
        background: cached ? 'var(--green)' : 'var(--text-tertiary)',
        flexShrink: 0,
        display: 'inline-block',
      }}/>
      {cached ? 'Redis Hit' : 'DB Query'}
    </div>
  );
}
