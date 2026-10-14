import { useGetStudentResults, getGetStudentResultsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Award, Clock, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Results() {
  const { user } = useAuth();
  const studentId = user?.id ?? 0;
  const { data: results, isLoading } = useGetStudentResults(studentId, {
    query: { enabled: !!user?.id, queryKey: getGetStudentResultsQueryKey(studentId) }
  });

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Exam Results</h2>
        <p className="text-muted-foreground mt-1">Review your past performance and detailed feedback.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Results</CardTitle>
          <CardDescription>Results for published completed exams.</CardDescription>
        </CardHeader>
        <CardContent>
          {!results || results.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/20">
              <FileText className="w-12 h-12 mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-foreground">No results available</h3>
              <p className="text-sm mt-1 max-w-sm">You haven't completed any exams yet, or results have not been published by the administration.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam Title</TableHead>
                  <TableHead>Date Submitted</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">{result.examTitle}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {new Date(result.submittedAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>{result.totalScore}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-secondary rounded-full h-2 max-w-[60px]">
                          <div className="bg-primary h-2 rounded-full" style={{ width: `${result.percentage}%` }} />
                        </div>
                        <span>{result.percentage}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={result.percentage >= 60 ? "default" : "destructive"}>
                        {result.grade}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/student/results/${result.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
