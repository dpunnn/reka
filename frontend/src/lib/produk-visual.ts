import {
  Salad,
  Coffee,
  Egg,
  Sprout,
  Carrot,
  Droplet,
  Wheat,
  Package,
  type LucideIcon,
} from "lucide-react";

interface ProdukVisual {
  icon: LucideIcon;
  bg: string;
  iconColor: string;
}

const KEYWORD_MAP: Array<{ match: RegExp; visual: ProdukVisual }> = [
  { match: /cabai|tomat/i, visual: { icon: Salad, bg: "bg-red-50", iconColor: "text-red-600" } },
  { match: /kopi/i, visual: { icon: Coffee, bg: "bg-amber-50", iconColor: "text-amber-700" } },
  { match: /telur/i, visual: { icon: Egg, bg: "bg-yellow-50", iconColor: "text-yellow-600" } },
  { match: /jagung/i, visual: { icon: Sprout, bg: "bg-lime-50", iconColor: "text-lime-700" } },
  { match: /wortel/i, visual: { icon: Carrot, bg: "bg-orange-50", iconColor: "text-orange-600" } },
  { match: /madu/i, visual: { icon: Droplet, bg: "bg-yellow-50", iconColor: "text-yellow-500" } },
  { match: /gula/i, visual: { icon: Droplet, bg: "bg-amber-50", iconColor: "text-amber-600" } },
  { match: /beras/i, visual: { icon: Wheat, bg: "bg-amber-50", iconColor: "text-amber-700" } },
  { match: /bawang/i, visual: { icon: Salad, bg: "bg-rose-50", iconColor: "text-rose-600" } },
  { match: /singkong/i, visual: { icon: Sprout, bg: "bg-orange-50", iconColor: "text-orange-700" } },
];

const FALLBACK: ProdukVisual = { icon: Package, bg: "bg-slate-100", iconColor: "text-slate-500" };

export function getProdukVisual(nama: string): ProdukVisual {
  const found = KEYWORD_MAP.find((k) => k.match.test(nama));
  return found ? found.visual : FALLBACK;
}
