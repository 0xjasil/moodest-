"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Activity,
  Search,
  RefreshCw,
  Clock,
  User,
  Globe,
  Database,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/lib/api-client";

interface ActivityLog {
  id: string;
  action: string;
  details: string;
  userId: string | null;
  userEmail: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedActionType, setSelectedActionType] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Real NestJS endpoint via proxy: GET /api/admin/audit-logs
      const response = await fetch(`/api/admin/audit-logs?limit=200`).catch(() =>
        fetch(`${API_URL}/admin/audit-logs?limit=200`)
      );
      if (response.ok) {
        const data = await response.json();
        const logsArray = Array.isArray(data) ? data : [];
        if (logsArray.length > 0) {
          setLogs(logsArray.map((log: {
            id: number;
            entity?: string;
            action: string;
            adminId?: number;
            details: string | Record<string, unknown>;
            createdAt: string;
          }) => ({
            id: String(log.id),
            action: log.action,
            details: typeof log.details === "object"
              ? JSON.stringify(log.details)
              : String(log.details || ""),
            userId: log.adminId ? String(log.adminId) : null,
            userEmail: null,
            ipAddress: null,
            createdAt: log.createdAt,
          })));
          return;
        } else {
          setLogs([]);
          return;
        }
      }
      setLogs([]);
    } catch (error) {
      console.warn("Could not fetch audit logs from backend:", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const actionTypes = useMemo(() => {
    const types = new Set<string>();
    logs.forEach((log) => {
      // Extract prefix or use action directly
      const type = log.action.split("_")[0];
      types.add(type);
    });
    return ["ALL", ...Array.from(types)];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.userEmail && log.userEmail.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType =
        selectedActionType === "ALL" || log.action.startsWith(selectedActionType);

      return matchesSearch && matchesType;
    });
  }, [logs, searchQuery, selectedActionType]);

  const getActionBadgeColor = (action: string) => {
    if (action.startsWith("CREATE")) return "bg-green-100 text-green-800 border-green-200 hover:bg-green-100";
    if (action.startsWith("UPDATE")) return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100";
    if (action.startsWith("DELETE")) return "bg-red-100 text-red-800 border-red-200 hover:bg-red-100";
    if (action.startsWith("BAN")) return "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100";
    if (action.startsWith("LOGIN")) return "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100";
    return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Activity Logs</h1>
          <p className="text-muted-foreground">Track administrative actions and system modifications</p>
        </div>
        <Button onClick={fetchLogs} variant="outline" size="icon" title="Refresh logs">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activities or user emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Action Type Filter */}
        <div className="flex flex-wrap gap-2">
          {actionTypes.map((type) => (
            <Button
              key={type}
              variant={selectedActionType === type ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedActionType(type)}
              className="rounded-full px-4 text-xs font-semibold"
            >
              {type}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Activity Log Stream
          </CardTitle>
          <CardDescription>
            Audit trail of events executed on the admin panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <RefreshCw className="h-8 w-8 animate-spin" />
              <span>Loading activity audit trails...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-lg text-muted-foreground gap-2">
              <Database className="h-8 w-8" />
              <span className="font-semibold">No logs found</span>
              <span className="text-sm">Try tweaking your search queries or filter selections.</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Event Summary</TableHead>
                  <TableHead>User / Admin</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/50">
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getActionBadgeColor(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate font-medium text-sm">
                      {log.details}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <User className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span className="font-mono text-xs">{log.userEmail || "System"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3 text-gray-400" />
                        <span>{log.ipAddress || "Localhost"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedLog(log)}
                        title="View log details"
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        {selectedLog && (
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Audit Trail details
              </DialogTitle>
              <DialogDescription>
                Detailed overview of the recorded administrative event
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-sm">
              <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-2">
                <span className="font-semibold text-muted-foreground">Log ID</span>
                <span className="col-span-2 font-mono text-xs break-all">{selectedLog.id}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-2">
                <span className="font-semibold text-muted-foreground">Timestamp</span>
                <span className="col-span-2 font-mono text-xs">{new Date(selectedLog.createdAt).toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-2">
                <span className="font-semibold text-muted-foreground">Action Type</span>
                <span className="col-span-2">
                  <Badge variant="outline" className={getActionBadgeColor(selectedLog.action)}>
                    {selectedLog.action}
                  </Badge>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-2">
                <span className="font-semibold text-muted-foreground">Actor</span>
                <span className="col-span-2 font-mono text-xs">{selectedLog.userEmail || "System Autoloop"}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-2">
                <span className="font-semibold text-muted-foreground">IP Address</span>
                <span className="col-span-2 font-mono text-xs">{selectedLog.ipAddress || "127.0.0.1"}</span>
              </div>
              <div className="space-y-1.5 pt-2">
                <p className="font-semibold text-muted-foreground">Event details</p>
                <div className="bg-[#F3F2EE] dark:bg-zinc-900 border p-4 rounded-xl font-mono text-xs whitespace-pre-wrap leading-relaxed text-foreground">
                  {selectedLog.details}
                </div>
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
