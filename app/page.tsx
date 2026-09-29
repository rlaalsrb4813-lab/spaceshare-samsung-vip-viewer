import Link from "next/link";
import { getEventSheetUrl, getVipNotesSheetUrl, config } from "@/lib/config";
import { getVipCompanies, getVipDashboardStats, getVipFilters } from "@/lib/vip-db";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

function formatWon(value: number) {
  return `₩${new Intl.NumberFormat("ko-KR").format(value)}`;
}

function formatCompactWon(value: number) {
  if (value >= 100000000) {
    const eok = value / 100000000;
    return `${Number.isInteger(eok) ? eok : eok.toFixed(1)}억`;
  }
  if (value >= 10000) {
    const man = value / 10000;
    return `${Number.isInteger(man) ? man : man.toFixed(1)}만`;
  }
  return formatWon(value);
}

function makeHref(values: Record<string, string>) {
  const search = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const query = search.toString();
  return query ? `/?${query}` : "/";
}

export default async function VipHome({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const customerCategory = typeof params.customerCategory === "string" ? params.customerCategory : "";
  const eventType = typeof params.eventType === "string" ? params.eventType : "";
  const page = Math.max(1, Number(typeof params.page === "string" ? params.page : "1") || 1);

  const [companies, stats, filters] = await Promise.all([
    getVipCompanies({ q, customerCategory, eventType }),
    getVipDashboardStats({ q, customerCategory, eventType }),
    getVipFilters(),
  ]);

  const totalPages = Math.max(1, Math.ceil(companies.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageCompanies = companies.slice(pageStart, pageStart + PAGE_SIZE);
  const startRow = companies.length === 0 ? 0 : pageStart + 1;
  const endRow = companies.length === 0 ? 0 : Math.min(pageStart + PAGE_SIZE, companies.length);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);
  const baseParams = { q, customerCategory, eventType };
  const refreshHref = makeHref({ ...baseParams, page: String(currentPage) });

  return (
    <main className="page-shell">
      <div className="topbar">
        <div>
          <div className="badge">스페이스쉐어 삼성역센터 VIP 상담일지 Viewer</div>
          <h1 className="title">대형·장기고객 상담일지 보드</h1>
          <div className="subtitle">
            삼성 행사 DB에서 누적 확정 매출 {formatCompactWon(config.vipMinConfirmedRevenue)} 이상 업체만 추려서 보여주는 전용 관리 화면입니다.
            행사 조회용 DB와 분리해서, VIP 전담팀이 업체 단위로 상담 이력과 후속 액션을 쌓을 수 있게 구성했습니다.
          </div>
        </div>
        <div className="topbar-actions">
          <Link className="button button-soft" href={refreshHref}>최신데이터 반영</Link>
          <a className="button button-soft" href={getEventSheetUrl()} target="_blank">행사 DB 원본 시트</a>
          <a className="button button-soft" href={getVipNotesSheetUrl()} target="_blank">상담일지 원본 시트</a>
          <form method="post" action="/api/logout"><button className="button button-logout" type="submit">로그아웃</button></form>
        </div>
      </div>

      <section className="kpis">
        <div className="kpi"><div className="kpi-label">VIP 업체 수</div><div className="kpi-value">{stats.vipCompanyCount}</div><div className="kpi-sub">누적 확정 매출 기준 충족 업체</div></div>
        <div className="kpi"><div className="kpi-label">기준 금액</div><div className="kpi-value">{formatCompactWon(config.vipMinConfirmedRevenue)}</div><div className="kpi-sub">확정 누적 매출 하한선</div></div>
        <div className="kpi"><div className="kpi-label">확정 누적 매출 합계</div><div className="kpi-value">{formatCompactWon(stats.totalConfirmedRevenue)}</div><div className="kpi-sub">필터 적용 결과 기준</div></div>
        <div className="kpi"><div className="kpi-label">관련 행사 수</div><div className="kpi-value">{stats.totalEvents}</div><div className="kpi-sub">해당 VIP 업체의 전체 행사 합계</div></div>
      </section>

      <section className="card card-strong" style={{ marginBottom: 22 }}>
        <div className="section-head">
          <div>
            <h2 className="section-title">검색 및 필터</h2>
            <div className="section-copy">업체명, 담당자, 행사유형, 고객구분으로 대형·장기고객 업체만 빠르게 찾을 수 있습니다.</div>
          </div>
        </div>

        <form method="get" className="form-grid">
          <input type="hidden" name="page" value="1" />
          <div className="field search-wide">
            <label className="field-label" htmlFor="q">통합 검색</label>
            <input id="q" name="q" className="input" defaultValue={q} placeholder="업체명, 담당자, 번호, 행사유형 검색" />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="customerCategory">고객구분</label>
            <select id="customerCategory" name="customerCategory" className="select" defaultValue={customerCategory}>
              <option value="">전체</option>
              {filters.customerCategories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="eventType">행사유형</label>
            <select id="eventType" name="eventType" className="select" defaultValue={eventType}>
              <option value="">전체</option>
              {filters.eventTypes.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div className="actions" style={{ justifyContent: "flex-end" }}>
            <button className="button button-primary" type="submit">조회</button>
            <Link className="button button-soft" href="/">초기화</Link>
          </div>
        </form>
      </section>

      <section className="card card-strong">
        <div className="section-head">
          <div>
            <h2 className="section-title">VIP 업체 리스트</h2>
            <div className="section-copy">누적 확정 매출 기준을 만족한 업체만 업체 단위로 묶어서 보여줍니다.</div>
          </div>
          <div className="table-meta">총 {companies.length}개 업체 · {startRow}-{endRow} 표시</div>
        </div>

        {pageCompanies.length === 0 ? (
          <div className="empty">조건에 맞는 VIP 업체가 없습니다.</div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>순위</th>
                    <th>업체명</th>
                    <th>확정 누적매출</th>
                    <th>확정 건수</th>
                    <th>전체 행사수</th>
                    <th>최근 행사일</th>
                    <th>최근 담당자</th>
                    <th>고객구분</th>
                    <th>상세</th>
                    <th>상담일지</th>
                  </tr>
                </thead>
                <tbody>
                  {pageCompanies.map((company, index) => (
                    <tr key={company.companyKey}>
                      <td className="cell-nowrap">{pageStart + index + 1}</td>
                      <td>
                        <div className="primary-text">{company.companyName}</div>
                        <div className="secondary-text">행사유형 {company.eventTypes.join(", ") || "-"}</div>
                      </td>
                      <td className="money">{formatWon(company.confirmedRevenue)}</td>
                      <td className="cell-nowrap">{company.confirmedCount}</td>
                      <td className="cell-nowrap">{company.totalEvents}</td>
                      <td className="cell-nowrap">{company.latestEventDate || "-"}</td>
                      <td>
                        <div className="primary-text">{company.latestManagerName || "-"}</div>
                        <div className="secondary-text">{company.latestManagerPhone || "-"}</div>
                      </td>
                      <td className="cell-nowrap">{company.customerCategory || "-"}</td>
                      <td><Link className="action-link" href={`/companies/${encodeURIComponent(company.companyKey)}`}>상세</Link></td>
                      <td><Link className="action-link" href={`/companies/${encodeURIComponent(company.companyKey)}/notes`}>상담일지</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <Link className={`page-button ${currentPage === 1 ? "disabled" : ""}`} href={makeHref({ ...baseParams, page: String(Math.max(1, currentPage - 1)) })}>이전</Link>
              <div className="page-numbers">
                {pageNumbers.map((pageNumber) => (
                  <Link key={pageNumber} className={`page-number ${pageNumber === currentPage ? "active" : ""}`} href={makeHref({ ...baseParams, page: String(pageNumber) })}>{pageNumber}</Link>
                ))}
              </div>
              <Link className={`page-button ${currentPage === totalPages ? "disabled" : ""}`} href={makeHref({ ...baseParams, page: String(Math.min(totalPages, currentPage + 1)) })}>다음</Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
