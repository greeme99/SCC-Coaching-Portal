import { redirect } from 'next/navigation';

// 첫 화면은 대시보드 (03.IA §4)
export default function Home() {
  redirect('/dashboard');
}
