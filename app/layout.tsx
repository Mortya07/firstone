import type { Metadata } from "next";
import "./globals.css";
import "./product.css";
import "./navigation.css";
import "./crm.css";

export const metadata: Metadata = {
  metadataBase:new URL('https://brigadir-kz.alizhansamat087.chatgpt.site'),
  alternates:{canonical:'/'},
  openGraph:{locale:'ru_KZ',type:'website',siteName:'Бригадир',title:'Бригадир — ремонт и строительство в Казахстане',description:'Ремонтные и строительные бригады, цены, портфолио и CRM для управления заказами.'},
  title: {default:"Бригадир — ремонтные и строительные бригады в Казахстане",template:"%s | Бригадир"},
  description: "Найдите бригаду для ремонта или строительства дома в Казахстане. Сравните портфолио и цены. CRM для бригад: клиенты, сделки и задачи.",
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
