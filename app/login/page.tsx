export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : "";
  const next = typeof params.next === "string" ? params.next : "/";

  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="badge">스페이스쉐어 삼성역센터 VIP 상담일지</div>
        <h1 className="login-title">VIP 전담팀 전용 로그인</h1>
        <div className="login-copy">
          누적 확정 매출 2,000만원 이상 업체의 상담일지와 후속 액션을 관리하는 전용 화면입니다.
          비밀번호를 입력하면 VIP 업체 리스트와 상담일지 페이지에 접근할 수 있습니다.
        </div>

        {error ? <div className="error-box">비밀번호가 올바르지 않습니다.</div> : null}

        <form method="post" action="/api/login" className="stack" style={{ marginTop: 18 }}>
          <input type="hidden" name="next" value={next} />
          <div className="field">
            <label className="field-label" htmlFor="password">접속 비밀번호</label>
            <input id="password" name="password" className="input" type="password" placeholder="VIP 전담팀 비밀번호 입력" required />
          </div>
          <button className="button button-primary" type="submit">접속하기</button>
        </form>
      </section>
    </main>
  );
}
