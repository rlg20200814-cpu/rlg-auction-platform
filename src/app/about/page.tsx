import Header from '@/components/layout/Header';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Instagram, MessageCircle } from 'lucide-react';

export default function AboutPage() {
  return (
    <>
      <div className="cyber-scanline" />
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-12 md:py-20 space-y-24">

        {/* ── Hero ── */}
        <section className="relative">
          <hr className="rlg-rule mb-8" />

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-xs text-white/25 tracking-[0.4em] uppercase font-mono mb-4">
                RLG REPTILE / ABOUT
              </p>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none text-white mb-4">
                關於我們
              </h1>
              <p className="text-white/35 text-sm tracking-wider max-w-sm leading-relaxed">
                用熱情經營，用誠信交易。
              </p>
            </div>

            <div className="hidden md:block opacity-15 hover:opacity-30 transition-opacity shrink-0">
              <Image src="/logo-dark.png" alt="RLG" width={120} height={72} className="object-contain" />
            </div>
          </div>

          <hr className="rlg-rule mt-8" />
        </section>

        {/* ── Brand Story ── */}
        <section className="grid md:grid-cols-2 gap-12 md:gap-16 items-start">
          <div>
            <p className="text-[10px] text-white/20 tracking-[0.4em] uppercase font-mono mb-4">OUR STORY</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 tracking-tight">
              品牌故事
            </h2>
            <div className="space-y-4 text-white/50 text-sm leading-loose tracking-wide">
              <p>
                RLG Reptile 從對爬蟲的純粹熱愛出發，致力於在台灣推廣負責任的爬蟲飼養文化。
              </p>
              <p>
                我們相信，每一隻爬蟲都值得被認真對待——從繁殖、照養，到找到對的主人。
                這也是我們建立這個競標與零售平台的初衷：讓每一筆交易都公開、透明、有保障。
              </p>
              <p>
                無論你是剛入門的新手，還是深耕多年的資深玩家，我們都歡迎你加入這個社群。
              </p>
            </div>
          </div>

          {/* Values */}
          <div className="space-y-4">
            <p className="text-[10px] text-white/20 tracking-[0.4em] uppercase font-mono mb-4">VALUES</p>
            {[
              { label: '透明', desc: '每筆競標公開紀錄，不做暗盤，不藏資訊' },
              { label: '品質', desc: '親繁或嚴選，每隻均附基本健康資訊' },
              { label: '服務', desc: 'LINE 即時回覆，售後問題一律處理到底' },
              { label: '社群', desc: '不只是買賣，更是一個互相分享的爬蟲社群' },
            ].map(({ label, desc }, i) => (
              <div key={label} className="flex gap-5 items-start group">
                <div className="mt-0.5 shrink-0 w-7 h-7 border border-white/15 flex items-center justify-center text-[10px] font-mono text-white/30 group-hover:border-white/40 group-hover:text-white/60 transition-all">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/80 mb-1">{label}</p>
                  <p className="text-xs text-white/35 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Specialty ── */}
        <section>
          <hr className="rlg-rule mb-12" />
          <p className="text-[10px] text-white/20 tracking-[0.4em] uppercase font-mono mb-8 text-center">SPECIALTY</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px border border-white/8 overflow-hidden">
            {[
              { label: '活體', sub: '親繁 & 嚴選', tag: 'LIVE' },
              { label: '爬箱', sub: '各式尺寸規格', tag: 'TERRARIUM' },
              { label: '燈具', sub: '保暖 & UV 設備', tag: 'LIGHTING' },
              { label: '周邊', sub: '飼養耗材配件', tag: 'SUPPLIES' },
            ].map(({ label, sub, tag }) => (
              <div
                key={tag}
                className="bg-brand-gray-900 p-6 md:p-8 flex flex-col gap-2 hover:bg-white/5 transition-colors group"
              >
                <p className="text-[9px] text-white/15 tracking-[0.3em] uppercase font-mono">{tag}</p>
                <p className="text-lg md:text-xl font-bold text-white/80 group-hover:text-white transition-colors">{label}</p>
                <p className="text-xs text-white/30">{sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Contact ── */}
        <section>
          <hr className="rlg-rule mb-12" />

          <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-start">
            <div className="flex-1">
              <p className="text-[10px] text-white/20 tracking-[0.4em] uppercase font-mono mb-4">CONTACT</p>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">
                聯絡我們
              </h2>
              <p className="text-white/40 text-sm leading-relaxed mb-6">
                有任何問題、合作邀約，或只是想聊聊爬蟲，都歡迎透過以下管道聯絡我們。
              </p>

              <div className="space-y-3">
                <a
                  href="https://www.instagram.com/rlg_reptile_studio/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 border border-white/15 flex items-center justify-center group-hover:border-white/50 transition-colors">
                    <Instagram className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs text-white/60 group-hover:text-white transition-colors">Instagram</p>
                    <p className="text-[10px] text-white/25 font-mono">@rlg_reptile_studio</p>
                  </div>
                </a>

                <a
                  href="https://lin.ee/o5UuAwc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 border border-white/15 flex items-center justify-center group-hover:border-white/50 transition-colors">
                    <MessageCircle className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs text-white/60 group-hover:text-white transition-colors">LINE 官方帳號</p>
                    <p className="text-[10px] text-white/25 font-mono">lin.ee/o5UuAwc</p>
                  </div>
                </a>

                <a
                  href="https://line.me/ti/g2/mP_8XsTAnqZnXuncV6AhEMh4_hZG80s7LU0cww?utm_source=invitation&utm_medium=link_copy&utm_campaign=default"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 border border-white/15 flex items-center justify-center group-hover:border-white/50 transition-colors">
                    <MessageCircle className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs text-white/60 group-hover:text-white transition-colors">LINE 社群群組</p>
                    <p className="text-[10px] text-white/25 font-mono">點擊加入群組</p>
                  </div>
                </a>
              </div>
            </div>

            {/* CTA card */}
            <div className="border border-white/8 p-6 md:p-8 flex-1 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/30" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/30" />

              <p className="text-[10px] text-white/20 tracking-[0.4em] uppercase font-mono mb-3">GET STARTED</p>
              <h3 className="text-lg font-bold text-white mb-3">想購買或競標？</h3>
              <p className="text-xs text-white/35 leading-relaxed mb-5">
                直接前往競標頁面或零售商品頁，找到你心儀的爬蟲或周邊。
              </p>
              <div className="flex flex-col gap-2">
                <Link href="/auction" className="btn-primary py-2.5 text-xs justify-center">
                  <span>前往競標</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link href="/shop" className="btn-secondary py-2.5 text-xs justify-center">
                  <span>瀏覽零售商品</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom rule */}
        <hr className="rlg-rule" />
      </main>
    </>
  );
}
