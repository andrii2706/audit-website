import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { telHref } from '@/lib/format';
import { Phone, Telegram } from './Icons';

type Props = { locale: Locale; phone?: string | null; telegramUrl?: string | null; labels: { call: string; consultation: string } };

/** App-style bottom bar on phones and small tablets: call, Telegram, consultation. */
export default function MobileActionBar({ locale, phone, telegramUrl, labels }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 px-3 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-xl gap-2">
        {phone && (
          <a href={telHref(phone)} aria-label={labels.call} className="inline-flex h-12 w-14 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line-strong text-ink">
            <Phone />
          </a>
        )}
        {telegramUrl && (
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border border-line-strong text-[15px] font-semibold text-ink"
          >
            <Telegram /> Telegram
          </a>
        )}
        <Link
          href={`/${locale}#estimate`}
          className="inline-flex h-12 flex-[1.4] cursor-pointer items-center justify-center rounded-full bg-accent px-3 text-[15px] font-semibold text-white"
        >
          {labels.consultation}
        </Link>
      </div>
    </div>
  );
}
