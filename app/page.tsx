import { redirect } from 'next/navigation';

// 메인 화면은 프로그램 개요 (DEC-030). 입장 후·로고 클릭 모두 여기서 시작해 사이드 메뉴로 이동한다
export default function Home() {
  redirect('/program/overview');
}
