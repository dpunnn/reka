import { fileUrl } from "@/lib/api";
import { getProdukVisual } from "@/lib/produk-visual";
import { cn } from "@/lib/utils";

export function ProductThumb({
  nama,
  fotoUrl,
  className,
  iconClassName,
}: {
  nama: string;
  fotoUrl?: string | null;
  className?: string;
  iconClassName?: string;
}) {
  const visual = getProdukVisual(nama);
  const src = fileUrl(fotoUrl);

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={nama} className={cn("h-full w-full object-cover", className)} />
    );
  }

  return (
    <div className={cn("flex h-full w-full items-center justify-center", visual.bg, className)}>
      <visual.icon className={cn("h-10 w-10", visual.iconColor, iconClassName)} strokeWidth={1.8} />
    </div>
  );
}
