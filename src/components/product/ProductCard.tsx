import Image from 'next/image';
import { formatCurrency, getImagePlaceholder } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ShoppingBag } from 'lucide-react';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const image = product.images?.[0] || getImagePlaceholder(product.title);
  const isSoldOut = product.status === 'sold_out' || product.stock === 0;

  return (
    <div className={cn(
      'relative border overflow-hidden flex flex-col h-full transition-all duration-300',
      'bg-brand-gray-900',
      isSoldOut
        ? 'border-white/6 opacity-50'
        : 'border-white/10 hover:border-white/30 hover:-translate-y-0.5'
    )}>

      {/* Corner brackets — top left */}
      <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/40 z-10 transition-all duration-300 group-hover:w-4 group-hover:h-4 group-hover:border-white/70" />
      {/* Corner brackets — bottom right */}
      <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/40 z-10 transition-all duration-300 group-hover:w-4 group-hover:h-4 group-hover:border-white/70" />

      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-black group">
        <Image
          src={image}
          alt={product.title}
          fill
          className={cn(
            'object-cover transition-all duration-500',
            'group-hover:scale-103 filter grayscale-[20%] group-hover:grayscale-0'
          )}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Status badge */}
        <div className="absolute top-3 left-3 z-10">
          {isSoldOut ? (
            <span className="border border-white/15 text-white/30 text-[10px] tracking-[0.2em] uppercase px-2 py-0.5">
              SOLD OUT
            </span>
          ) : (
            <span className="flex items-center gap-1.5 bg-white text-black text-[10px] font-bold tracking-[0.2em] uppercase px-2 py-0.5">
              IN STOCK
            </span>
          )}
        </div>

        {/* Stock count */}
        {!isSoldOut && product.stock > 0 && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-black/70 text-white/60 text-[10px] px-2 py-0.5 font-mono">
            <ShoppingBag className="w-2.5 h-2.5" />
            {product.stock}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Category + Title */}
        <div>
          <p className="text-[9px] text-white/25 tracking-[0.35em] uppercase font-mono mb-1">
            {product.category || 'RLG REPTILE'}
          </p>
          <h3 className="font-semibold text-sm md:text-base line-clamp-2 text-white/90 hover:text-white transition-colors tracking-tight">
            {product.title}
          </h3>
          {product.ageClass && (
            <p className="text-[10px] text-white/30 mt-0.5 font-mono">{product.ageClass}</p>
          )}
        </div>

        <div className="mt-auto space-y-3">
          {/* Separator */}
          <div className="flex items-center gap-2">
            <hr className="flex-1 border-none h-px bg-white/8" />
          </div>

          {/* Price */}
          <div>
            <p className="text-[9px] text-white/25 tracking-[0.3em] uppercase font-mono mb-1">
              PRICE
            </p>
            <p className={cn(
              'font-mono font-bold tabular-nums tracking-tight text-xl md:text-2xl',
              isSoldOut ? 'text-white/40' : 'text-white'
            )}>
              {formatCurrency(product.price)}
            </p>
          </div>

          {/* Condition */}
          {product.condition && (
            <div className="border-t border-white/8 pt-2">
              <p className="text-[10px] text-white/30 font-mono tracking-wider">
                {product.condition}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
