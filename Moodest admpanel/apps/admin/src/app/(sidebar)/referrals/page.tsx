"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Copy, Gift, Users } from "lucide-react";

const stats = [
  { title: "Total Referrals", value: "284", hint: "All time sign-ups" },
  { title: "Converted", value: "96", hint: "33.8% conversion rate" },
  { title: "Rewards Paid", value: "₹72,400", hint: "Credits issued" },
  { title: "Active Codes", value: "18", hint: "Running campaigns" },
];

const referrals = [
  {
    id: "rf1",
    referrer: "Sophia Carter",
    referred: "nina.park@example.com",
    code: "SOPHIA25",
    status: "Converted",
    reward: "₹250",
    date: "Oct 2, 2026",
  },
  {
    id: "rf2",
    referrer: "Marcus Vance",
    referred: "tom.hardy@example.com",
    code: "MARCUS10",
    status: "Pending",
    reward: "—",
    date: "Sep 28, 2026",
  },
  {
    id: "rf3",
    referrer: "Elena Rostova",
    referred: "k.petrov@example.com",
    code: "ELENA15",
    status: "Converted",
    reward: "₹150",
    date: "Sep 21, 2026",
  },
  {
    id: "rf4",
    referrer: "Liam O'Connor",
    referred: "sara.j@example.com",
    code: "LIAM50",
    status: "Expired",
    reward: "—",
    date: "Aug 30, 2026",
  },
];

export default function ReferralsPage() {
  const [code] = useState("AURORA-REF-2026");

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Referral code copied");
    } catch {
      toast.error("Could not copy code");
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Referrals</h1>
            <p className="text-muted-foreground">
              Refer-a-friend program performance
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <Card key={s.title}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {s.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.hint}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-4 w-4" /> Shareable Code
              </CardTitle>
              <CardDescription>
                Friends get ₹100 off their first order; you earn ₹250 credit
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <code className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm font-bold tracking-widest dark:border-gray-700">
                {code}
              </code>
              <Button variant="outline" onClick={copyCode}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Code
              </Button>
              <Button onClick={() => toast.success("Invite link shared (demo)")}>
                <Users className="mr-2 h-4 w-4" />
                Share Invite Link
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Referrals</CardTitle>
              <CardDescription>
                Latest invitations and their reward status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referrer</TableHead>
                    <TableHead>Referred</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Reward</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.referrer}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.referred}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.code}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.date}
                      </TableCell>
                      <TableCell>{r.reward}</TableCell>
                      <TableCell>
                        {r.status === "Converted" ? (
                          <Badge className="bg-green-600 hover:bg-green-700 text-white">
                            Converted
                          </Badge>
                        ) : r.status === "Pending" ? (
                          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                            Pending
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                          >
                            Expired
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
