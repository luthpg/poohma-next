import { ZustandProvider } from '@/components/custom/zustand/provider';
import type { ChildrenProps } from '@/lib/types';

export default function AuthLayout({ children }: ChildrenProps) {
  return (
    <ZustandProvider>
      <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 dark:bg-gray-800'>
        <div className='max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-900 shadow-lg rounded-lg'>
          <div className='text-center'>
            <h2 className='mt-6 text-3xl font-extrabold text-gray-900 dark:text-white'>
              Poohma へようこそ
            </h2>
            <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
              アカウント情報を安全に管理
            </p>
          </div>
          {children}
        </div>
      </div>
    </ZustandProvider>
  );
}
