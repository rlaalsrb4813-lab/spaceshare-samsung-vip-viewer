import Link from "next/link";
import { notFound } from "next/navigation";
import { getVipNotesSheetUrl } from "@/lib/config";
import { getVipCompanyByKey, getVipNotes } from "@/lib/vip-db";

export const dynamic = "force-dynamic";

function priorityClass(priority: string) {
  const normalized = priority || "일반";
  return `priority priority-${normalized}`;
}

export default async function VipCompanyNotesPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyKey: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { companyKey } = await params;
  const query = await searchParams;
  const saved = typeof query.saved === "string" ? query.saved : "";
  const company = await getVipCompanyByKey(decodeURIComponent(companyKey));
  if (!company) notFound();

  const notes = await getVipNotes(company.companyName);

  return (
    <main className="page-shell">
      <div className="topbar">
        <div>
          <Link href={`/companies/${encodeURIComponent(company.companyKey)}`} className="badge">← 업체 상세로 돌아가기</Link>
          <h1 className="title">{company.companyName} 상담일지</h1>
          <div className="subtitle">
            대형·장기고객 관리용 상담 메모, 관계 이력, 후속 액션을 업체 단위로 쌓는 화면입니다.
          </div>
        </div>
        <div className="topbar-actions">
          <a className="button button-soft" href={getVipNotesSheetUrl()} target="_blank">상담일지 원본 시트</a>
        </div>
      </div>

      {saved ? <div className="notice" style={{ marginBottom: 18 }}>상담일지가 저장되었습니다.</div> : null}

      <div className="grid grid-2">
        <section className="card card-strong">
          <div className="section-head">
            <div>
              <h2 className="section-title">상담일지 작성</h2>
              <div className="section-copy">직원이 직접 코멘트를 남기고, 다음 액션까지 함께 기록하는 입력 영역입니다.</div>
            </div>
          </div>

          <form className="stack" method="post" action="/api/vip-notes">
            <input type="hidden" name="companyKey" value={company.companyKey} />
            <input type="hidden" name="companyName" value={company.companyName} />

            <div className="field">
              <label className="field-label" htmlFor="author">작성자</label>
              <input id="author" name="author" className="input" placeholder="예: 김민규" required />
            </div>

            <div className="grid grid-2">
              <div className="field">
                <label className="field-label" htmlFor="consultationType">상담구분</label>
                <select id="consultationType" name="consultationType" className="select" defaultValue="전화" required>
                  <option value="전화">전화</option>
                  <option value="미팅">미팅</option>
                  <option value="이메일">이메일</option>
                  <option value="메시지">메시지</option>
                  <option value="운영메모">운영메모</option>
                  <option value="기타">기타</option>
                </select>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="priority">중요도</label>
                <select id="priority" name="priority" className="select" defaultValue="일반">
                  <option value="일반">일반</option>
                  <option value="중요">중요</option>
                  <option value="최우선">최우선</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="note">상담내용</label>
              <textarea id="note" name="note" className="textarea" placeholder="상담 내용, 분위기, 요청사항, 이슈를 기록하세요." required />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="nextAction">후속조치</label>
              <textarea id="nextAction" name="nextAction" className="textarea" placeholder="다음 연락 일정, 후속 액션, 담당자 메모를 적어두세요." />
            </div>

            <button className="button button-primary" type="submit">상담일지 저장</button>
          </form>
        </section>

        <section className="card card-strong">
          <div className="section-head">
            <div>
              <h2 className="section-title">업체 요약</h2>
              <div className="section-copy">VIP 업체 기준값과 최근 담당자 정보를 함께 확인할 수 있습니다.</div>
            </div>
          </div>
          <div className="definition-grid">
            <div className="field-card">
              <div className="field-name">업체명</div>
              <div className="field-value">{company.companyName}</div>
            </div>
            <div className="field-card">
              <div className="field-name">확정 누적 매출</div>
              <div className="field-value">₩{new Intl.NumberFormat("ko-KR").format(company.confirmedRevenue)}</div>
            </div>
            <div className="field-card">
              <div className="field-name">확정 건수</div>
              <div className="field-value">{company.confirmedCount}</div>
            </div>
            <div className="field-card">
              <div className="field-name">최근 담당자</div>
              <div className="field-value">{company.latestManagerName || "-"} {company.latestManagerPhone ? `· ${company.latestManagerPhone}` : ""}</div>
            </div>
            <div className="field-card long">
              <div className="field-name">행사유형</div>
              <div className="field-value">{company.eventTypes.join(", ") || "-"}</div>
            </div>
            <div className="field-card long">
              <div className="field-name">사용 홀</div>
              <div className="field-value">{company.rooms.join(", ") || "-"}</div>
            </div>
          </div>
        </section>
      </div>

      <section className="card card-strong" style={{ marginTop: 22 }}>
        <div className="section-head">
          <div>
            <h2 className="section-title">상담일지 기록</h2>
            <div className="section-copy">가장 최근에 작성된 메모가 위로 오도록 정렬됩니다.</div>
          </div>
          <div className="table-meta">총 {notes.length}건</div>
        </div>

        {notes.length === 0 ? (
          <div className="empty">아직 등록된 상담일지가 없습니다.</div>
        ) : (
          <div className="note-list">
            {notes.map((item) => (
              <article key={`${item.rowNumber}-${item.createdAt}`} className="note-card">
                <div className="note-top">
                  <div className="primary-text">{item.consultationType}</div>
                  <span className={priorityClass(item.priority)}>{item.priority || "일반"}</span>
                </div>
                <div className="note-meta">
                  <span>작성일시 {item.createdAt || "-"}</span>
                  <span>작성자 {item.author || "-"}</span>
                </div>
                <div className="note-body">{item.note || "-"}</div>
                <div className="note-next">후속조치: {item.nextAction || "-"}</div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
