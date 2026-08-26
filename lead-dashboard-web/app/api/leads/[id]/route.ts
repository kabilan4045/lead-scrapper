import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { EDITABLE_FIELDS, isAssignedTo, isStatus } from "@/lib/constants";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid lead id" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const keys = Object.keys(body);
  if (keys.length === 0) {
    return NextResponse.json({ error: "No fields provided" }, { status: 400 });
  }
  const unknown = keys.filter((k) => !(EDITABLE_FIELDS as readonly string[]).includes(k));
  if (unknown.length) {
    return NextResponse.json(
      { error: `These fields can't be edited: ${unknown.join(", ")}` },
      { status: 400 }
    );
  }

  const update: Record<string, unknown> = {};

  if ("status" in body) {
    if (!isStatus(body.status)) {
      return NextResponse.json({ error: `Invalid status: ${body.status}` }, { status: 400 });
    }
    update.status = body.status;
  }

  if ("assigned_to" in body) {
    if (body.assigned_to && !isAssignedTo(body.assigned_to)) {
      return NextResponse.json(
        { error: `Invalid assigned_to: ${body.assigned_to}` },
        { status: 400 }
      );
    }
    update.assigned_to = body.assigned_to || null;
  }

  if ("follow_up_date" in body) {
    update.follow_up_date = body.follow_up_date || null;
  }

  if ("notes" in body) {
    update.notes = typeof body.notes === "string" && body.notes ? body.notes : null;
  }

  const { data, error } = await supabaseAdmin
    .from("leads")
    .update(update)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  return NextResponse.json(data);
}
