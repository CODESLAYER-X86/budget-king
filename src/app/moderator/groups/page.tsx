import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function ModeratorGroupsPage() {
  const groups = await db.group.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      owner: { select: { email: true, fullName: true } },
      _count: { select: { members: true, products: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Group Moderation</h1>
        <p className="text-sm text-muted-foreground">
          {groups.length} groups — review content and suspend problematic groups.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Owner</TableHead>
                <TableHead className="text-center">Members</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Products</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No groups have been created yet.
                  </TableCell>
                </TableRow>
              ) : (
                groups.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-mono text-xs">{g.code}</TableCell>
                    <TableCell className="text-sm font-medium">{g.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {g.owner.fullName ?? g.owner.email}
                    </TableCell>
                    <TableCell className="text-center text-sm">{g._count.members}</TableCell>
                    <TableCell className="text-center text-sm hidden sm:table-cell">{g._count.products}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          g.status === "ACTIVE" ? "default" :
                          g.status === "SUSPENDED" ? "destructive" :
                          "secondary"
                        }
                      >
                        {g.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
