import { useState } from "react";
import { useGetExamMonitor, getGetExamMonitorQueryKey, useListAdminExams } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function LiveMonitor() {
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);

  const { data: exams } = useListAdminExams({ status: 'ONGOING' });

  // Use the first ongoing exam by default if none selected
  const activeExamId = selectedExamId || (exams && exams.length > 0 ? exams[0].id : null);

  const { data: sessions, isLoading } = useGetExamMonitor(activeExamId as number, {
    query: {
      enabled: !!activeExamId,
      queryKey: getGetExamMonitorQueryKey(activeExamId as number),
      refetchInterval: 5000 // Refresh every 5 seconds
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Live Exam Monitor</h2>
          <p className="text-muted-foreground mt-1">Real-time proctoring and session tracking.</p>
        </div>
        <div className="w-64">
          <Select 
            value={activeExamId?.toString() || ""} 
            onValueChange={(val) => setSelectedExamId(Number(val))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select ongoing exam" />
            </SelectTrigger>
            <SelectContent>
              {exams?.map(e => (
                <SelectItem key={e.id} value={e.id.toString()}>{e.title}</SelectItem>
              ))}
              {(!exams || exams.length === 0) && (
                <SelectItem value="none" disabled>No ongoing exams</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> Active Sessions</CardTitle>
          <CardDescription>Auto-refreshes every 5 seconds.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!activeExamId ? (
            <div className="p-12 text-center text-muted-foreground">Select an ongoing exam to monitor sessions.</div>
          ) : isLoading ? (
            <div className="p-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started At</TableHead>
                  <TableHead>Current Q#</TableHead>
                  <TableHead className="text-right">Violations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions?.map((session) => (
                  <TableRow key={session.sessionId}>
                    <TableCell className="font-medium">{session.studentName}</TableCell>
                    <TableCell>
                      <Badge variant={session.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {session.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(session.startTime).toLocaleTimeString()}</TableCell>
                    <TableCell>{session.currentQuestionIndex + 1}</TableCell>
                    <TableCell className="text-right">
                      <div className={`inline-flex items-center gap-1 font-bold ${session.tabSwitchCount > 0 ? 'text-destructive' : 'text-green-500'}`}>
                        {session.tabSwitchCount > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        {session.tabSwitchCount} switches
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!sessions || sessions.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No active sessions found for this exam.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
