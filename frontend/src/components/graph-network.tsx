"use client";

interface GraphNode {
  id: string;
  nama: string;
}

interface GraphNetworkProps {
  anggota: GraphNode | null;
  vouchers: GraphNode[];
  vouchees: GraphNode[];
}

const WIDTH = 480;
const HEIGHT = 320;
const CENTER = { x: WIDTH / 2, y: HEIGHT / 2 };
const NODE_RADIUS = 26;

function arcPositions(count: number, yLevel: number, spread = 340) {
  if (count === 0) return [];
  if (count === 1) return [{ x: CENTER.x, y: yLevel }];
  const start = CENTER.x - spread / 2;
  const step = spread / (count - 1);
  return Array.from({ length: count }, (_, i) => ({ x: start + step * i, y: yLevel }));
}

export function GraphNetwork({ anggota, vouchers, vouchees }: GraphNetworkProps) {
  if (!anggota) {
    return <p className="text-sm text-muted-foreground">Data graph tidak tersedia.</p>;
  }

  const voucherPositions = arcPositions(vouchers.length, 55);
  const voucheePositions = arcPositions(vouchees.length, HEIGHT - 55);

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ maxHeight: 320 }}>
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#2563eb" />
        </marker>
        <radialGradient id="nodeVoucher" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#eff6ff" />
          <stop offset="100%" stopColor="#bfdbfe" />
        </radialGradient>
        <radialGradient id="nodeVouchee" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#f0fdf4" />
          <stop offset="100%" stopColor="#bbf7d0" />
        </radialGradient>
        <radialGradient id="nodeCenter" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="100%" stopColor="#fde68a" />
        </radialGradient>
        <filter id="nodeShadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#1e3a8a" floodOpacity="0.22" />
        </filter>
      </defs>

      {/* Edges: voucher -> center (mereka memvouch anggota ini) */}
      {vouchers.map((v, i) => (
        <line
          key={`in-${v.id}`}
          x1={voucherPositions[i].x}
          y1={voucherPositions[i].y + NODE_RADIUS}
          x2={CENTER.x}
          y2={CENTER.y - NODE_RADIUS}
          stroke="#2563eb"
          strokeWidth={1.5}
          markerEnd="url(#arrow)"
        />
      ))}

      {/* Edges: center -> vouchee (anggota ini memvouch mereka) */}
      {vouchees.map((v, i) => (
        <line
          key={`out-${v.id}`}
          x1={CENTER.x}
          y1={CENTER.y + NODE_RADIUS}
          x2={voucheePositions[i].x}
          y2={voucheePositions[i].y - NODE_RADIUS}
          stroke="#16a34a"
          strokeWidth={1.5}
          markerEnd="url(#arrow)"
        />
      ))}

      {/* Voucher nodes */}
      {vouchers.map((v, i) => (
        <g key={v.id} filter="url(#nodeShadow)">
          <circle cx={voucherPositions[i].x} cy={voucherPositions[i].y} r={NODE_RADIUS} fill="url(#nodeVoucher)" stroke="#2563eb" strokeWidth={1.5} />
          <text x={voucherPositions[i].x} y={voucherPositions[i].y} textAnchor="middle" dominantBaseline="middle" fontSize={9} fontWeight={600} fill="#1e3a8a">
            {v.nama.split(" ")[0]}
          </text>
        </g>
      ))}

      {/* Vouchee nodes */}
      {vouchees.map((v, i) => (
        <g key={v.id} filter="url(#nodeShadow)">
          <circle cx={voucheePositions[i].x} cy={voucheePositions[i].y} r={NODE_RADIUS} fill="url(#nodeVouchee)" stroke="#16a34a" strokeWidth={1.5} />
          <text x={voucheePositions[i].x} y={voucheePositions[i].y} textAnchor="middle" dominantBaseline="middle" fontSize={9} fontWeight={600} fill="#14532d">
            {v.nama.split(" ")[0]}
          </text>
        </g>
      ))}

      {/* Center node (anggota yang direview) */}
      <g filter="url(#nodeShadow)">
        <circle cx={CENTER.x} cy={CENTER.y} r={NODE_RADIUS + 6} fill="url(#nodeCenter)" stroke="#d97706" strokeWidth={2} />
        <text x={CENTER.x} y={CENTER.y} textAnchor="middle" dominantBaseline="middle" fontSize={10} fontWeight={700} fill="#78350f">
          {anggota.nama.split(" ")[0]}
        </text>
      </g>

      {vouchers.length === 0 && (
        <text x={CENTER.x} y={30} textAnchor="middle" fontSize={10} fill="#94a3b8">
          Belum ada yang memvouch
        </text>
      )}
      {vouchees.length === 0 && (
        <text x={CENTER.x} y={HEIGHT - 10} textAnchor="middle" fontSize={10} fill="#94a3b8">
          Belum memvouch anggota lain
        </text>
      )}
    </svg>
  );
}
