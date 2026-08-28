export const STATUS_OPTIONS = [
  "New",
  "Contacted",
  "Follow-up",
  "Interested",
  "Not Interested",
  "Closed-Won",
  "Closed-Lost",
] as const;
export type Status = (typeof STATUS_OPTIONS)[number];

export const ASSIGNED_TO_OPTIONS = ["Chetan", "Nandhu"] as const;
export type AssignedTo = (typeof ASSIGNED_TO_OPTIONS)[number];

export function randomAssignee(): AssignedTo {
  return ASSIGNED_TO_OPTIONS[Math.floor(Math.random() * ASSIGNED_TO_OPTIONS.length)];
}

export const EDITABLE_FIELDS = [
  "status",
  "assigned_to",
  "follow_up_date",
  "notes",
  "payment_received",
] as const;
export type EditableField = (typeof EDITABLE_FIELDS)[number];

export type Lead = {
  id: number;
  business_name: string;
  contact_person: string | null;
  phone_number: string;
  city_area: string | null;
  category: string | null;
  source: string | null;
  date_added: string;
  assigned_to: AssignedTo | null;
  status: Status;
  follow_up_date: string | null;
  deal_value: number | null;
  domain_name: string | null;
  payment_received: boolean;
  site_delivered: boolean;
  notes: string | null;
  website: string | null;
  rating: number | null;
  email: string | null;
  address: string | null;
  opening_hours: string | null;
  reviews_count: number | null;
  created_at: string;
};

export function isStatus(value: unknown): value is Status {
  return typeof value === "string" && (STATUS_OPTIONS as readonly string[]).includes(value);
}

export function isAssignedTo(value: unknown): value is AssignedTo {
  return typeof value === "string" && (ASSIGNED_TO_OPTIONS as readonly string[]).includes(value);
}
