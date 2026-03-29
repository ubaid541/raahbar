import { MapPin, MessageSquare } from 'lucide-react';

export default function GuesthouseCard({ guesthouse, isWide }) {
  const { name, location, region, price_range, notes, whatsapp, rider_friendly } = guesthouse;
  const priceSymbol = price_range === 'Budget' ? '$' : price_range === 'Mid-range' ? '$$' : '$$$';

  return (
    <div className={`${isWide ? 'md:col-span-8' : 'md:col-span-4'} group relative overflow-hidden rounded-2xl bg-surface transition-all duration-500 hover:shadow-2xl hover:shadow-tertiary/10`}>
      <div className={`grid grid-cols-1 ${isWide ? 'md:grid-cols-2' : ''} h-full`}>
        <div className={`relative ${isWide ? 'h-64 md:h-full' : 'h-48'} overflow-hidden bg-surface-high flex items-center justify-center`}>
          <span className="material-symbols-outlined text-6xl text-on-surface-variant opacity-20">landscape</span>
          <div className="absolute top-4 left-4 flex gap-2">
            {rider_friendly && (
              <span className="bg-secondary text-secondary-container px-3 py-1 rounded-lg font-label text-[10px] font-black uppercase tracking-tighter">
                Rider Friendly
              </span>
            )}
            {price_range === 'Budget' && (
              <span className="bg-primary/20 backdrop-blur-md text-primary px-3 py-1 rounded-lg font-label text-[10px] font-black uppercase tracking-tighter">
                Budget
              </span>
            )}
          </div>
        </div>
        <div className="p-8 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className={`font-headline ${isWide ? 'text-3xl' : 'text-2xl'} font-bold mb-1`}>{name}</h3>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <MapPin className="w-3 h-3" />
                  <span className="font-label text-xs uppercase tracking-wide">{location} · {region}</span>
                </div>
              </div>
              <span className="font-headline text-xl text-tertiary font-bold">{priceSymbol}</span>
            </div>
            <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">{notes}</p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={whatsapp ? `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}` : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-tertiary text-background py-3 rounded-xl font-label font-bold text-xs uppercase tracking-widest text-center transition-all hover:bg-tertiary-container flex items-center justify-center gap-2 min-h-[48px]"
            >
              <MessageSquare className="w-4 h-4 fill-current" />
              WhatsApp Contact
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
