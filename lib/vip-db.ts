import { config, assertEventConfig, assertVipNotesConfig } from "@/lib/config";
import { getSheetsClient } from "@/lib/google";
import type { EventRow, VipCompany, VipDashboardStats, VipNote } from "@/lib/types";

const eventHeaders = [
  "NO",
  "상태",
  "고객구분",
  "업체명",
  "유입경로",
  "행사유형",
  "홀",
  "인원수",
  "시작일",
  "종료일",
  "담당자1 이름",
  "담당자1 번호",
  "담당자1 메일",
  "담당자1 소속구분",
  "담당자2 이름",
  "담당자2 번호",
  "담당자2 메일",
  "담당자2 소속구분",
  "대관료",
  "세팅비",
  "렌탈",
  "케이터링",
  "참고사항",
  "운영사항",
  "취소이유",
  "확정이유",
  "캘린더 이벤트 ID",
  "원본 제목",
  "원본 본문",
  "마지막 동기화일시",
] as const;

const vipNoteHeaders = ["작성일시", "업체명", "작성자", "상담구분", "상담내용", "후속조치", "중요도"] as const;

function normalize(value: unknown) {
  return String(value || "").trim();
}

function normalizeCompanyName(value: string) {
  return normalize(value).replace(/\s+/g, " ");
}

function makeCompanyKey(companyName: string) {
  return normalizeCompanyName(companyName);
}

function parseMoney(value: string) {
  const cleaned = String(value || "").replace(/[^0-9.-]/g, "");
  if (!cleaned) return 0;
  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : 0;
}

function objectFromHeader(header: string[], row: string[]) {
  return Object.fromEntries(header.map((key, index) => [key, normalize(row[index])])) as Record<string, string>;
}

function parseEventDate(value: string) {
  const text = normalize(value);
  if (!text) return null;

  const normalized = text.replace(/[년./]/g, "-").replace(/월/g, "-").replace(/일/g, "").replace(/\s+/g, "");
  const full = normalized.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (full) {
    const [, y, m, d] = full;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }

  const short = normalized.match(/(\d{2})-(\d{1,2})-(\d{1,2})/);
  if (short) {
    const [, y, m, d] = short;
    return new Date(2000 + Number(y), Number(m) - 1, Number(d));
  }

  return null;
}

function formatDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatSeoulDateTime(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return formatter.format(date).replace(" ", " ");
}

function mapEventRow(row: Record<string, string>, rowNumber: number): EventRow {
  return {
    rowNumber,
    no: row["NO"] || "",
    status: row["상태"] || "",
    customerCategory: row["고객구분"] || "",
    companyName: row["업체명"] || "",
    leadSource: row["유입경로"] || "",
    eventType: row["행사유형"] || "",
    room: row["홀"] || "",
    peopleCount: row["인원수"] || "",
    startDate: row["시작일"] || "",
    endDate: row["종료일"] || "",
    manager1Name: row["담당자1 이름"] || "",
    manager1Phone: row["담당자1 번호"] || "",
    manager1Email: row["담당자1 메일"] || "",
    manager1OrgType: row["담당자1 소속구분"] || "",
    manager2Name: row["담당자2 이름"] || "",
    manager2Phone: row["담당자2 번호"] || "",
    manager2Email: row["담당자2 메일"] || "",
    manager2OrgType: row["담당자2 소속구분"] || "",
    rentalFee: parseMoney(row["대관료"]),
    settingFee: parseMoney(row["세팅비"]),
    rentalExtraFee: parseMoney(row["렌탈"]),
    cateringFee: parseMoney(row["케이터링"]),
    referenceNotes: row["참고사항"] || "",
    operationsNotes: row["운영사항"] || "",
    cancelReason: row["취소이유"] || "",
    confirmReason: row["확정이유"] || "",
    calendarEventId: row["캘린더 이벤트 ID"] || `row-${rowNumber}`,
    rawTitle: row["원본 제목"] || "",
    rawDescription: row["원본 본문"] || "",
    lastSyncedAt: row["마지막 동기화일시"] || "",
    raw: row,
  };
}

async function readEventRows() {
  assertEventConfig();
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId,
    range: `${config.sourceSheetName}!A:AD`,
  });
  return response.data.values || [];
}

export async function getEvents() {
  const rows = await readEventRows();
  if (!rows.length || rows.length < config.headerRow) return [] as EventRow[];

  const header = rows[config.headerRow - 1] || [...eventHeaders];
  const dataRows = rows.slice(config.dataStartRow - 1).filter((row) => row.some((cell) => String(cell || "").trim()));
  return dataRows
    .map((row, index) => mapEventRow(objectFromHeader(header, row), config.dataStartRow + index))
    .sort((a, b) => {
      const aNo = Number(a.no || 0);
      const bNo = Number(b.no || 0);
      if (aNo && bNo) return bNo - aNo;
      return b.rowNumber - a.rowNumber;
    });
}

function aggregateVipCompanies(events: EventRow[]) {
  const map = new Map<string, VipCompany>();

  for (const event of events) {
    const companyName = normalizeCompanyName(event.companyName);
    if (!companyName) continue;

    const companyKey = makeCompanyKey(companyName);
    const existing = map.get(companyKey) || {
      companyKey,
      companyName,
      confirmedRevenue: 0,
      confirmedCount: 0,
      totalEvents: 0,
      latestEventDate: "",
      latestStatus: "",
      customerCategory: event.customerCategory || "",
      latestManagerName: "",
      latestManagerPhone: "",
      eventTypes: [],
      rooms: [],
      events: [],
      contacts: [],
    };

    existing.totalEvents += 1;
    existing.events.push(event);

    if (event.status === "확") {
      existing.confirmedRevenue += event.rentalFee;
      existing.confirmedCount += 1;
    }

    const eventDate = parseEventDate(event.startDate || event.endDate);
    const currentLatestDate = parseEventDate(existing.latestEventDate);
    if (!currentLatestDate || (eventDate && eventDate > currentLatestDate)) {
      existing.latestEventDate = eventDate ? formatDate(eventDate) : existing.latestEventDate || event.startDate || "";
      existing.latestStatus = event.status || existing.latestStatus;
      existing.customerCategory = event.customerCategory || existing.customerCategory;
      existing.latestManagerName = event.manager1Name || event.manager2Name || existing.latestManagerName;
      existing.latestManagerPhone = event.manager1Phone || event.manager2Phone || existing.latestManagerPhone;
    }

    if (event.eventType && !existing.eventTypes.includes(event.eventType)) existing.eventTypes.push(event.eventType);
    const rooms = event.room.split(",").map((room) => normalize(room)).filter(Boolean);
    for (const room of rooms) {
      if (!existing.rooms.includes(room)) existing.rooms.push(room);
    }

    for (const person of [
      {
        name: event.manager1Name,
        phone: event.manager1Phone,
        email: event.manager1Email,
        orgType: event.manager1OrgType,
      },
      {
        name: event.manager2Name,
        phone: event.manager2Phone,
        email: event.manager2Email,
        orgType: event.manager2OrgType,
      },
    ]) {
      if (!person.name && !person.phone && !person.email) continue;
      const exists = existing.contacts.some((item) => item.name === person.name && item.phone === person.phone && item.email === person.email);
      if (!exists) existing.contacts.push(person);
    }

    map.set(companyKey, existing);
  }

  return [...map.values()]
    .filter((company) => company.confirmedRevenue >= config.vipMinConfirmedRevenue)
    .sort((a, b) => {
      if (b.confirmedRevenue !== a.confirmedRevenue) return b.confirmedRevenue - a.confirmedRevenue;
      return a.companyName.localeCompare(b.companyName, "ko");
    });
}

export async function getVipCompanies(filters?: { q?: string; customerCategory?: string; eventType?: string }) {
  const events = await getEvents();
  const companies = aggregateVipCompanies(events);
  const q = normalize(filters?.q || "").toLowerCase();
  const customerCategory = normalize(filters?.customerCategory || "");
  const eventType = normalize(filters?.eventType || "");

  return companies.filter((company) => {
    if (customerCategory && company.customerCategory !== customerCategory) return false;
    if (eventType && !company.eventTypes.includes(eventType)) return false;
    if (!q) return true;

    const searchable = [
      company.companyName,
      company.latestManagerName,
      company.latestManagerPhone,
      company.customerCategory,
      company.eventTypes.join(" "),
      company.rooms.join(" "),
      ...company.contacts.map((item) => [item.name, item.phone, item.email, item.orgType].join(" ")),
    ].join(" ").toLowerCase();

    return searchable.includes(q);
  });
}

export async function getVipDashboardStats(filters?: { q?: string; customerCategory?: string; eventType?: string }): Promise<VipDashboardStats> {
  const companies = await getVipCompanies(filters);
  return {
    vipCompanyCount: companies.length,
    totalConfirmedRevenue: companies.reduce((sum, company) => sum + company.confirmedRevenue, 0),
    totalConfirmedEvents: companies.reduce((sum, company) => sum + company.confirmedCount, 0),
    totalEvents: companies.reduce((sum, company) => sum + company.totalEvents, 0),
  };
}

export async function getVipFilters() {
  const companies = await getVipCompanies();
  const unique = (values: string[]) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko"));
  return {
    customerCategories: unique(companies.map((company) => company.customerCategory)),
    eventTypes: unique(companies.flatMap((company) => company.eventTypes)),
  };
}

export async function getVipCompanyByKey(companyKey: string) {
  const companies = await getVipCompanies();
  return companies.find((company) => company.companyKey === companyKey) || null;
}

async function ensureVipNotesSheet() {
  assertVipNotesConfig();
  const sheets = getSheetsClient();
  const spreadsheetId = config.vipNotesSpreadsheetId;
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existing = meta.data.sheets?.find((sheet) => sheet.properties?.title === config.vipNotesSheetName);

  if (!existing) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: config.vipNotesSheetName } } }],
      },
    });
  }

  const headerRange = `${config.vipNotesSheetName}!A1:G1`;
  const headerResponse = await sheets.spreadsheets.values.get({ spreadsheetId, range: headerRange });
  const currentHeader = (headerResponse.data.values?.[0] || []).map((value) => String(value || ""));
  const isHeaderSame = vipNoteHeaders.every((header, index) => currentHeader[index] === header);

  if (!isHeaderSame) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: headerRange,
      valueInputOption: "RAW",
      requestBody: { values: [Array.from(vipNoteHeaders)] },
    });
  }
}

export async function getVipNotes(companyName: string) {
  assertVipNotesConfig();
  await ensureVipNotesSheet();

  const sheets = getSheetsClient();
  const spreadsheetId = config.vipNotesSpreadsheetId;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${config.vipNotesSheetName}!A:G`,
  });

  const rows = response.data.values || [];
  if (rows.length <= 1) return [] as VipNote[];

  return rows
    .slice(1)
    .map((row, index) => {
      const record = objectFromHeader(Array.from(vipNoteHeaders), row);
      return {
        rowNumber: index + 2,
        createdAt: record["작성일시"] || "",
        companyName: record["업체명"] || "",
        author: record["작성자"] || "",
        consultationType: record["상담구분"] || "",
        note: record["상담내용"] || "",
        nextAction: record["후속조치"] || "",
        priority: record["중요도"] || "",
      } satisfies VipNote;
    })
    .filter((note) => normalizeCompanyName(note.companyName) === normalizeCompanyName(companyName))
    .sort((a, b) => b.rowNumber - a.rowNumber);
}

export async function appendVipNote(input: {
  companyName: string;
  author: string;
  consultationType: string;
  note: string;
  nextAction: string;
  priority: string;
}) {
  assertVipNotesConfig();
  await ensureVipNotesSheet();

  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: config.vipNotesSpreadsheetId,
    range: `${config.vipNotesSheetName}!A:G`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [[
        formatSeoulDateTime(),
        normalizeCompanyName(input.companyName),
        normalize(input.author),
        normalize(input.consultationType),
        normalize(input.note),
        normalize(input.nextAction),
        normalize(input.priority),
      ]],
    },
  });
}
