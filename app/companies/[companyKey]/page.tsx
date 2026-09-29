import Link from "next/link";
import { notFound } from "next/navigation";
import { getVipNotesSheetUrl } from "@/lib/config";
import { getVipCompanyByKey } from "@/lib/vip-db";

export const dynamic = "force-dynamic";

function formatWon(value: number) {
  return `₩${new Intl.NumberFormat("ko-KR").format(value)}`;
}

function Field({ label, value, long = false }: { label: string; value: string | number; long?: boolean }) {
  const display = value === "" || value === null || value === undefined ? "-" : String(value);
  return (
    <div className={`field-card ${long ? "long" : ""}`}>
      <div className="field-name">{label}</div>
      <div className="field-value">{display}</div>
    </div>
  );
}

export default async function VipCompanyDetailPage({ params }: { params: Promise<{ companyKey: string }> }) {
  const { companyKey } = await params;
  const company = await getVipCompanyByKey(decodeURIComponent(companyKey));
  if (!company) notFound();

  return (
    <main className="page-shell">
      <div className="topbar">
        <div>
          <Link href="/" className="badge">← VIP 리스트로 돌아가기</Link>
          <h1 className="title">{company.companyName}</h1>
          <div className="subtitle">
            VIP 기준에 해당하는 업체의 누적 매출, 담당자, 관련 행사 목록을 회사 단위로 묶어 보여줍니다.
          </div>
        </div>
        <div className="topbar-actions">
          <Link className="button button-primary" href={`/companies/${encodeURIComponent(company.companyKey)}/notes`}>상담일지</Link>
          <a className="button button-soft" href={getVipNotesSheetUrl()} target="_blank">상담일지 원본 시트</a>
        </div>
      </div>

      <section className="kpis">
        <div className="kpi"><div className="kpi-label">확정 누적 매출</div><div className="kpi-value">{formatWon(company.confirmedRevenue)}</div><div className="kpi-sub">VIP 기준 충족 금액</div></div>
        <div className="kpi"><div className="kpi-label">확정 건수</div><div className="kpi-value">{company.confirmedCount}</div><div className="kpi-sub">상태값 확 기준</div></div>
        <div className="kpi"><div className="kpi-label">전체 행사수</div><div className="kpi-value">{company.totalEvents}</div><div className="kpi-sub">이 업체로 묶인 전체 행사</div></div>
        <div className="kpi"><div className="kpi-label">최근 행사일</div><div className="kpi-value">{company.latestEventDate || "-"}</div><div className="kpi-sub">최근 담당자 {company.latestManagerName || "-"}</div></div>
      </section>

      <div className="grid grid-2">
        <section className="card card-strong">
          <div className="section-head">
            <div>
              <h2 className="section-title">업체 요약</h2>
              <div className="section-copy">회사 기준의 최근 상태, 주요 행사유형, 사용 홀을 한 번에 확인할 수 있습니다.</div>
            </div>
          </div>
          <div className="definition-grid">
            <Field label="업체명" value={company.companyName} />
            <Field label="고객구분" value={company.customerCategory || "-"} />
            <Field label="최근 상태" value={company.latestStatus || "-"} />
            <Field label="최근 담당자" value={company.latestManagerName || "-"} />
            <Field label="주요 행사유형" value={company.eventTypes.join(", ") || "-"} />
            <Field label="사용 홀" value={company.rooms.join(", ") || "-"} />
          </div>
        </section>

        <section className="card card-strong">
          <div className="section-head">
            <div>
              <h2 className="section-title">담당자 정보</h2>
              <div className="section-copy">행사 데이터에서 수집된 연락처를 중복 없이 정리했습니다.</div>
            </div>
          </div>
          <div className="stack">
            {company.contacts.length === 0 ? (
              <div className="empty">등록된 담당자 정보가 없습니다.</div>
            ) : (
              company.contacts.map((contact, index) => (
                <div key={`${contact.name}-${contact.phone}-${index}`} className="summary-card">
                  <div className="primary-text">{contact.name || "-"}</div>
                  <div className="secondary-text">{contact.phone || "번호 없음"}</div>
                  <div className="secondary-text">{contact.email || "메일 없음"}</div>
                  <div className="secondary-text">{contact.orgType || "소속구분 없음"}</div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="card card-strong" style={{ marginTop: 22 }}>
        <div className="section-head">
          <div>
            <h2 className="section-title">관련 행사 리스트</h2>
            <div className="section-copy">이 업체로 분류된 행사 원본을 모두 보여줍니다. 행사 단위 확인은 여기서 하면 됩니다.</div>
          </div>
          <div className="table-meta">총 {company.events.length}건</div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>NO</th>
                <th>상태</th>
                <th>행사유형</th>
                <th>홀</th>
                <th>인원수</th>
                <th>시작일</th>
                <th>종료일</th>
                <th>대관료</th>
                <th>담당자</th>
                <th>메모</th>
              </tr>
            </thead>
            <tbody>
              {company.events.map((event) => (
                <tr key={event.calendarEventId}>
                  <td className="cell-nowrap">{event.no || event.rowNumber}</td>
                  <td className="cell-nowrap"><span className={`status-chip status-${event.status || "기타"}`}>{event.status || "-"}</span></td>
                  <td>{event.eventType || "-"}</td>
                  <td className="cell-nowrap">{event.room || "-"}</td>
                  <td className="cell-nowrap">{event.peopleCount || "-"}</td>
                  <td className="cell-nowrap">{event.startDate || "-"}</td>
                  <td className="cell-nowrap">{event.endDate || "-"}</td>
                  <td className="money">{formatWon(event.rentalFee)}</td>
                  <td>
                    <div className="primary-text">{event.manager1Name || event.manager2Name || "-"}</div>
                    <div className="secondary-text">{event.manager1Phone || event.manager2Phone || "-"}</div>
                  </td>
                  <td>
                    <div className="secondary-text">{event.referenceNotes || event.operationsNotes || "-"}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
