import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Instrument_Sans, Syne } from "next/font/google";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { locales } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/server";
import { themeInitScript } from "@/lib/theme";
import "../globals.css";

const syne = Syne({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-syne", display: "swap" });
const instrument = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-instrument",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["500"], variable: "--font-plex-mono", display: "swap" });

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getDictionary(locale);
  return {
    title: { default: t.meta.title, template: "%s — Soon Finance" },
    description: t.meta.description,
    alternates: { languages: { fr: "/fr", en: "/en", "x-default": "/fr" } },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d0c" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale();
  const t = await getDictionary(locale);

  return (
    // data-theme est posé avant l'hydratation par themeInitScript : on ignore l'écart attendu.
    <html lang={locale} suppressHydrationWarning className={`${syne.variable} ${instrument.variable} ${plexMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-svh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-bg"
        >
          {t.meta.skip}
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <SmoothScroll />
      </body>
    </html>
  );
}
