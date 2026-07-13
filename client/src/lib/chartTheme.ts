/**
 * Shared Recharts tooltip styling. Recharts applies `contentStyle.color` only to
 * the tooltip container, so the item and label text need their own colors — that
 * omission is what made tooltip values render dark-on-dark. Spread `chartTooltip`
 * onto every <Tooltip /> for a consistent, readable dark tooltip in both themes.
 */
export const chartTooltip = {
  contentStyle: {
    borderRadius: 12,
    border: '1px solid rgba(148,163,184,0.25)',
    background: 'rgba(15,23,42,0.96)',
    color: '#f8fafc',
    boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
    padding: '8px 12px',
  },
  itemStyle: { color: '#e2e8f0' },
  labelStyle: { color: '#94a3b8', fontWeight: 600, marginBottom: 2 },
  cursor: { fill: 'rgba(148,163,184,0.1)' },
} as const;
