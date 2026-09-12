import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Decision Lab - AI 의사결정 지원 실험실',
  description: '복잡한 고민을 구조화하고 납득 가능한 결정을 내리도록 돕는 AI 의사결정 지원 웹앱',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
