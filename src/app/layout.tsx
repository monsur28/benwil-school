import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { DM_Mono, Manrope, Noto_Sans_Bengali } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { getLoginBranding, getRootBrandingVariables } from "@/lib/settings/branding";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali"],
  display: "swap",
});

// Dynamic per spec §17/§20: falls back to the application default name when
// no school/settings row exists yet (getLoginBranding() never throws).
export async function generateMetadata(): Promise<Metadata> {
  const branding = await getLoginBranding();
  return {
    title: branding.schoolName,
    description: `School management system for ${branding.schoolName}.`,
    icons: branding.faviconUrl ? { icon: branding.faviconUrl } : undefined,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, brandingVariables] = await Promise.all([getLocale(), getRootBrandingVariables()]);

  return (
    <html
      lang={locale}
      className={`${manrope.variable} ${dmMono.variable} ${notoSansBengali.variable} h-full antialiased`}
      style={brandingVariables as CSSProperties}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
