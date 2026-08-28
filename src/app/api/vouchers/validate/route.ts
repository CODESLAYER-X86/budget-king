import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateVoucherAction } from "@/actions/rewards";

const Schema = z.object({
  code: z.string().min(1),
  orderSubtotal: z.number().positive(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const result = await validateVoucherAction(parsed.data.code, parsed.data.orderSubtotal);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, discount: result.discount, voucherId: result.voucherId });
}
