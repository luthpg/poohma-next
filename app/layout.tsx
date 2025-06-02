import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/app/globals.css';
import { ThemeProvider } from '@/components/theme-provider';
// import { initializeAuthListener } from '@/lib/zustand/store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { useEffect } from 'react';
import { AuthInitializer } from '@/components/custom/auth/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PoohMa - アカウント情報管理',
  description: 'アカウント情報を安全に管理できる家族共有アプリ',
};

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ja' suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <QueryClientProvider client={queryClient}>
            <AuthInitializer>{children}</AuthInitializer>
          </QueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
