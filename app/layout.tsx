import type { Metadata } from "next";
import "./globals.css";
import "./product.css";

export const metadata: Metadata = {
  metadataBase:new URL('https://brigadir-kz.alizhansamat087.chatgpt.site'),
  alternates:{canonical:'/'},
  openGraph:{locale:'ru_KZ',type:'website',siteName:'Бригадир',title:'Бригадир — ремонт начинается с доверия',description:'Бригады, цены и портфолио для ремонта квартир, домов и офисов в Казахстане.'},
  title: {default:"Бригадир — ремонтные бригады в Казахстане",template:"%s | Бригадир"},
  description: "Выберите бригаду для ремонта квартиры, дома или офиса в Казахстане. Сравните портфолио, стоимость работ и опыт ремонтных компаний.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
