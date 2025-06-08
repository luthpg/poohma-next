import type { Metadata } from 'next';
import { Inter, Noto_Sans_JP } from 'next/font/google';
import '@/app/globals.css';
import { ThemeProvider } from '@/components/custom/common/theme-provider';
import { ZustandProvider } from '@/components/custom/zustand/provider';

const inter = Inter({ subsets: ['latin'] });
const notoSansJp = Noto_Sans_JP({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PoohMa - アカウント情報管理',
  description: 'アカウント情報を安全に管理できる家族共有アプリ',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ja' suppressHydrationWarning>
      <body className={`${inter.className} ${notoSansJp.className}`}>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <ZustandProvider>{children}</ZustandProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
