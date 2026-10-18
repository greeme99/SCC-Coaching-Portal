import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';

export default function NotFound() {
  return (
    <>
      <PageHeader title="요청한 화면을 찾을 수 없습니다" />
      <Link
        href="/"
        className="inline-flex min-h-11 items-center rounded-full bg-primary px-6 font-semibold text-on-primary"
      >
        메인 화면으로
      </Link>
    </>
  );
}
