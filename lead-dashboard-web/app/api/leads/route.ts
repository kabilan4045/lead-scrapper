import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAssignedTo, isStatus } from "@/lib/constants";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("*")
    .order("id", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const business_name = typeof body.business_name === "string" ? body.business_name.trim() : "";
  const phone_number = typeof body.phone_number === "string" ? body.phone_number.trim() : "";

  if (!business_name) {
    return NextResponse.json({ error: "Business name is required" }, { status: 400 });
  }
  if (!phone_number) {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }

  const status = isStatus(body.status) ? body.status : "New";
  const assigned_to = isAssignedTo(body.assigned_to) ? body.assigned_to : null;

  const insertPayload = {
    business_name,
    phone_number,
    contact_person: nullableString(body.contact_person),
    city_area: nullableString(body.city_area),
    category: nullableString(body.category),
    source: nullableString(body.source) ?? "Manual",
    assigned_to,
    status,
    notes: nullableString(body.notes),
    website: nullableString(body.website),
  };

  const { data, error } = await supabaseAdmin
    .from("leads")
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A lead with this phone number already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

function nullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
