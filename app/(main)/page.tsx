import { redirect } from 'next/navigation';

export default function MainRootPage() {
  redirect('/dashboard');
  return null;
}
