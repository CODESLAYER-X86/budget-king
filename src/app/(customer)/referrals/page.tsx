import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { getOrCreateMyReferralCode, getMyReferralEvents, getReferralBonusAmount } from "@/actions/referrals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Users } from "lucide-react";
import { ReferralActions } from "./referral-actions";
import { ClaimReferralCard } from "./claim-referral-card";

export const dynamic = "force-dynamic";

export default async function ReferralsPage() {
  const session = await getSession();
  if (!session?.profile) redirect("/login?next=/referrals");

  const [code, events, bonusAmount, myReferrerEvent] = await Promise.all([
    getOrCreateMyReferralCode(),
    getMyReferralEvents(),
    getReferralBonusAmount(),
    db.referralEvent.findFirst({
      where: { referredUserId: session.id },
      include: { referrer: { include: { user: { select: { fullName: true, email: true } } } } },
    }),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const referralLink = `${baseUrl}/?ref=${code.code}`;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Referrals</h1>
        <p className="text-sm text-muted-foreground">
          Invite friends — earn {bonusAmount} coins when their first order is delivered.
        </p>
      </div>

      {/* Claim a referral code */}
      <ClaimReferralCard
        existingReferrerName={myReferrerEvent?.referrer?.user?.fullName ?? myReferrerEvent?.referrer?.user?.email}
      />

      {/* Hero */}
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/20 p-3">
              <Gift className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Your Referral Code</p>
              <p className="text-3xl font-bold font-mono tracking-tight">{code.code}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {code.uses} clicks • {code.successful} successful referrals ({code.successful * bonusAmount} coins earned)
              </p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-1">Share your referral link:</p>
            <ReferralActions link={referralLink} code={code.code} />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Users className="mx-auto h-5 w-5 text-primary" />
            <p className="text-2xl font-bold mt-1">{code.uses}</p>
            <p className="text-xs text-muted-foreground">Visits</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Gift className="mx-auto h-5 w-5 text-primary" />
            <p className="text-2xl font-bold mt-1">{code.successful}</p>
            <p className="text-xs text-muted-foreground">Successful</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold mt-1.5">{code.successful * 500}</p>
            <p className="text-xs text-muted-foreground">Coins Earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Events */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Referral History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No referrals yet. Share your link to start earning bonus coins.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary">
                  <th className="text-left p-2">Referred Email</th>
                  <th className="text-center p-2">Status</th>
                  <th className="text-right p-2">Bonus</th>
                  <th className="text-right p-2 hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="p-2">{e.referredEmail}</td>
                    <td className="p-2 text-center">
                      <Badge
                        variant={
                          e.status === "REWARDED" ? "default" :
                          e.status === "FIRST_ORDER" ? "secondary" :
                          e.status === "SIGNED_UP" ? "outline" :
                          "outline"
                        }
                      >
                        {e.status.replace(/_/g, " ").toLowerCase()}
                      </Badge>
                    </td>
                    <td className="p-2 text-right">
                      {e.bonusCoinsAwarded > 0 ? `+${e.bonusCoinsAwarded}` : "—"}
                    </td>
                    <td className="p-2 text-right text-xs text-muted-foreground hidden sm:table-cell">
                      {new Date(e.createdAt).toLocaleDateString("en-BD")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6 bg-secondary/30">
        <CardContent className="p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">How it works</p>
          <ol className="list-decimal pl-5 space-y-1 text-xs">
            <li>Share your referral link with friends.</li>
            <li>When they sign up and place their first order, you both get rewarded.</li>
            <li>Once their first order is delivered, you earn 500 bonus coins.</li>
            <li>Use coins to redeem vouchers for discounts on future orders.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
