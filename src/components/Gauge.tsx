import { useId } from 'react';
import { MAX_CORTISOL } from '../game/battleEngine';

// Requested mapping: 0 degrees = 0 cortisol, 180 degrees = 100 cortisol.
const toGaugeAngle = (value: number): number => (Math.max(0, Math.min(100, value)) / 100) * 180;

type GaugeProps = {
  value: number;
  label: string;
};

export default function Gauge({ value, label }: GaugeProps) {
  const gradientId = useId();
  const angle = toGaugeAngle(value);
  const radius = 74;
  const center = 90;
  const radians = ((180 - angle) * Math.PI) / 180;
  const pointerX = center + radius * Math.cos(radians);
  const pointerY = center - radius * Math.sin(radians);

  return (
    <div className="gauge-card">
      <h3>{label}</h3>
      <svg viewBox="0 0 180 110" className="gauge-svg" role="img" aria-label={`${label} cortisol ${value}`}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#39ff6f" />
            <stop offset="50%" stopColor="#efe665" />
            <stop offset="100%" stopColor="#f64040" />
          </linearGradient>
        </defs>
        <path d="M16,90 A74,74 0 0,1 164,90" fill="none" stroke={`url(#${gradientId})`} strokeWidth="12" strokeLinecap="round" />
        <line x1={center} y1={90} x2={pointerX} y2={pointerY} stroke="#101f12" strokeWidth="4" strokeLinecap="round" />
        <circle cx={center} cy={90} r="6" fill="#101f12" />
        <text x="18" y="106" className="gauge-key">
          LOW
        </text>
        <text x="132" y="106" className="gauge-key">
          HIGH
        </text>
      </svg>
      <div className="cortisol-bar-wrap">
        <div className="cortisol-bar" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      <div className="cortisol-number">
        {value} / {MAX_CORTISOL}
      </div>
    </div>
  );
}
