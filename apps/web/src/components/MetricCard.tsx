import { ReactNode } from 'react';

interface MetricCardProps {
  label:   string;
  value:   number | string | null;
  icon:    ReactNode;
  change?: string;
  trend?:  'up' | 'down' | 'neutral';
  loading?: boolean;
}

export function MetricCard({ label, value, icon, change, trend = 'neutral', loading }: MetricCardProps) {
  const trendColor =
    trend === 'up'   ? 'var(--color-green)' :
    trend === 'down' ? 'var(--color-red)'   :
                       'var(--color-muted)';

  const trendSymbol =
    trend === 'up'   ? '↑' :
    trend === 'down' ? '↓' :
                       '—';

  return (
    <div
      className="card-hover"
      style={{
        background:   'var(--color-bg-card)',
        border:       '1px solid var(--color-border)',
        borderRadius: '12px',
        padding:      '20px 24px',
        flex:         1,
        minWidth:     0,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ color: 'var(--color-muted)', lineHeight: 1 }}>{icon}</div>
        {loading ? (
          <div className="skeleton" style={{ width: 48, height: 18 }} />
        ) : change ? (
          <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: trendColor, fontWeight: 500 }}>
            {trendSymbol}{change}
          </span>
        ) : null}
      </div>

      {loading ? (
        <>
          <div className="skeleton" style={{ width: '70%', height: 32, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: '50%', height: 14 }} />
        </>
      ) : (
        <>
          <div style={{
            fontSize:    '28px',
            fontFamily:  'var(--font-display)',
            fontWeight:  700,
            letterSpacing: '-0.01em',
            color:       'var(--color-text)',
            marginBottom: '4px',
          }}>
            {typeof value === 'number' ? value.toLocaleString() : value ?? '—'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
            {label}
          </div>
        </>
      )}
    </div>
  );
}
