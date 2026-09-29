import Link from "next/link";

export default function NotFound() {
  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="badge">스페이스쉐어 삼성역센터 VIP 상담일지</div>
        <h1 className="login-title">대상을 찾을 수 없습니다.</h1>
        <div className="login-copy">선택한 업체가 현재 VIP 기준에 없거나, 링크가 잘못되었을 수 있습니다.</div>
        <div style={{ marginTop: 18 }}>
          <Link className="button button-primary" href="/">VIP 리스트로 돌아가기</Link>
        </div>
      </section>
    </main>
  );
}
