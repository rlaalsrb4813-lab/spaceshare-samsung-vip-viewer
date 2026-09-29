export type EventRow = {
  rowNumber: number;
  no: string;
  status: string;
  customerCategory: string;
  companyName: string;
  leadSource: string;
  eventType: string;
  room: string;
  peopleCount: string;
  startDate: string;
  endDate: string;
  manager1Name: string;
  manager1Phone: string;
  manager1Email: string;
  manager1OrgType: string;
  manager2Name: string;
  manager2Phone: string;
  manager2Email: string;
  manager2OrgType: string;
  rentalFee: number;
  settingFee: number;
  rentalExtraFee: number;
  cateringFee: number;
  referenceNotes: string;
  operationsNotes: string;
  cancelReason: string;
  confirmReason: string;
  calendarEventId: string;
  rawTitle: string;
  rawDescription: string;
  lastSyncedAt: string;
  raw: Record<string, string>;
};

export type VipCompany = {
  companyKey: string;
  companyName: string;
  confirmedRevenue: number;
  confirmedCount: number;
  totalEvents: number;
  latestEventDate: string;
  latestStatus: string;
  customerCategory: string;
  latestManagerName: string;
  latestManagerPhone: string;
  eventTypes: string[];
  rooms: string[];
  events: EventRow[];
  contacts: Array<{
    name: string;
    phone: string;
    email: string;
    orgType: string;
  }>;
};

export type VipNote = {
  rowNumber: number;
  createdAt: string;
  companyName: string;
  author: string;
  consultationType: string;
  note: string;
  nextAction: string;
  priority: string;
};

export type VipDashboardStats = {
  vipCompanyCount: number;
  totalConfirmedRevenue: number;
  totalConfirmedEvents: number;
  totalEvents: number;
};
