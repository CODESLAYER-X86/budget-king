import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

/**
 * Secure endpoint for the client-side navbar to get the current user.
 * We use this INSTEAD of the Supabase JS client to prevent the Supabase SDK
 * from aggressively deleting auth cookies on mobile browsers during background refreshes.
 */
export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ user: null }, { headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json({
      user: {
        email: session.email,
        role: session.profile?.role ?? "CUSTOMER",
        fullName: session.profile?.fullName ?? null,
      }
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ user: null }, { headers: { "Cache-Control": "no-store" } });
  }
}
