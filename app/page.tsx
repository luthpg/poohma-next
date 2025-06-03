import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-4'>
      <h1 className='text-5xl font-extrabold text-center mb-6'>Poohma</h1>
      <p className='text-xl text-center max-w-2xl mb-8'>
        あなたのすべてのアカウント情報を安全に、そして家族と共有できるパスワードヒント管理アプリ。
      </p>
      <div className='space-x-4'>
        <Link href='/login' passHref>
          <Button
            size='lg'
            className='bg-indigo-600 hover:bg-indigo-700 text-white'
          >
            今すぐ始める
          </Button>
        </Link>
        <Link href='/dashboard' passHref>
          <Button
            variant='outline'
            size='lg'
            className='border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-400 dark:text-indigo-400 dark:hover:bg-gray-700'
          >
            ダッシュボードへ
          </Button>
        </Link>
      </div>

      <div className='mt-12 text-center'>
        <h3 className='text-2xl font-bold mb-4'>Poohmaの特長</h3>
        <ul className='list-disc list-inside text-lg space-y-2'>
          <li>
            <b>安全な暗号化</b>:
            パスワードヒントはクライアントサイドで強力に暗号化。
          </li>
          <li>
            <b>家族と共有</b>: 必要なアカウント情報を安全に家族と共有。
          </li>
          <li>
            <b>シンプルな管理</b>: 直感的なUIでアカウント情報を整理。
          </li>
          <li>
            <b>どこからでもアクセス</b>: Webベースでいつでもどこでも利用可能。
          </li>
        </ul>
      </div>
    </div>
  );
}
