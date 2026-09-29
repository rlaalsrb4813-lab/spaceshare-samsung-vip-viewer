export const config = {
  spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID || "1NaVY1RsR092u0JGVrso6aZTsNiOZ4JeT-l3pvwnF0Fw",
  sourceSheetName: process.env.SAMSUNG_SOURCE_SHEET_NAME || "삼성역센터 캘린더 정보",
  headerRow: Number(process.env.SAMSUNG_HEADER_ROW || 4),
  dataStartRow: Number(process.env.SAMSUNG_DATA_START_ROW || 5),
  vipNotesSpreadsheetId: process.env.VIP_NOTES_SPREADSHEET_ID || "",
  vipNotesSheetName: process.env.VIP_NOTES_SHEET_NAME || "VIP 상담일지",
  vipMinConfirmedRevenue: Number(process.env.VIP_MIN_CONFIRMED_REVENUE || 20000000),
  vipAccessPassword: process.env.VIP_ACCESS_PASSWORD || "",
};

export function assertEventConfig() {
  if (!config.spreadsheetId) throw new Error("GOOGLE_SPREADSHEET_ID가 설정되지 않았습니다.");
}

export function assertVipNotesConfig() {
  if (!config.vipNotesSpreadsheetId) throw new Error("VIP_NOTES_SPREADSHEET_ID가 설정되지 않았습니다.");
}

export function getEventSheetUrl() {
  return `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/edit`;
}

export function getVipNotesSheetUrl() {
  if (!config.vipNotesSpreadsheetId) return "#";
  return `https://docs.google.com/spreadsheets/d/${config.vipNotesSpreadsheetId}/edit`;
}
