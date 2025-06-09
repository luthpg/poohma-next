import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PoohMa',
    short_name: 'PoohMa',
    description: 'アカウント情報を安全に管理できる家族共有アプリ',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '',
    theme_color: '',
    icons: [
      {
        src: '/favicon.png',
        sizes: '16x16',
        type: 'image/png',
      },
    ],
  };
}
