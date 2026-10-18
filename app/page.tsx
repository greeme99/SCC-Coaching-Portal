import { PageHeader } from '@/components/PageHeader';

// 메인 화면 (DEC-030): 입장 후 처음 보는 화면. 특정 기능으로 바로 보내지 않고, 사이드 메뉴에서 원하는 항목을 고르게 한다
export default function Home() {
  return (
    <>
      <PageHeader title="삼코동 코칭 포털" description={<span className="break-keep">코칭 가이드, 일지·소감, 프로그램 현황, 코치 도구와 자료를 한곳에서 이용합니다.</span>} />
      <section className="rounded-lg bg-surface p-6 shadow-card">
        <p className="text-body">
          <span className="font-semibold text-main">왼쪽 메뉴에서 원하는 항목을 선택하세요.</span>
          <span className="mt-2 block lg:hidden">메뉴가 보이지 않으면 왼쪽 위 ☰ 버튼을 누르세요.</span>
        </p>
      </section>
    </>
  );
}
