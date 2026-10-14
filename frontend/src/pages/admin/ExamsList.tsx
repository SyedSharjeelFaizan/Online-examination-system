import { useState } from "react";
import { useListAdminExams, getListAdminExamsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Calendar, BookOpen } from "lucide-react";

export default function AdminExams() {
  const { data: exams, isLoading } = useListAdminExams({}, {
    query: {
      queryKey: getListAdminExamsQueryKey({})
    }
  });

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Exam Management</h2>
          <p className="text-muted-foreground mt-1">Create, configure, and publish examinations.</p>
        </div>
        <Button asChild>
          <Link href="/admin/exams/create">
            <Plus className="w-4 h-4 mr-2" /> Create Exam
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title & Subject</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams?.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell>
                    <p className="font-medium">{exam.title}</p>
                    <p className="text-xs text-muted-foreground">{exam.subject} • {exam.department || 'All'} • Sem {exam.semester || 'All'}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{exam.examType}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <BookOpen className="w-3 h-3" /> {exam.questionCount}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(exam.scheduledAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{exam.durationMinutes} mins</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      exam.status === "ONGOING" ? "destructive" : 
                      exam.status === "PUBLISHED" ? "default" : 
                      "secondary"
                    }>
                      {exam.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/exams/${exam.id}/edit`}>
                        <Edit className="w-4 h-4 mr-2" /> Edit
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {exams?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No exams found. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
