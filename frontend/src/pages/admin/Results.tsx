import { useState } from "react";
import { useListAdminExams, useGetExamResults, getGetExamResultsQueryKey, usePublishExamResults } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Award, Share } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function ResultsManagement() {
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Load completed exams
  const { data: exams } = useListAdminExams({ status: 'COMPLETED' });

  const activeExamId = selectedExamId || (exams && exams.length > 0 ? exams[0].id : null);

  const { data: results, isLoading } = useGetExamResults(activeExamId as number, {
    query: {
      enabled: !!activeExamId,
      queryKey: getGetExamResultsQueryKey(activeExamId as number)
    }
  });

  const publishMut = usePublishExamResults();

  const handlePublish = () => {
    if (!activeExamId) return;
    if (confirm("Are you sure you want to publish these results? Students will be able to see them immediately.")) {
      publishMut.mutate({ examId: activeExamId }, {
        onSuccess: (res) => {
          toast({ title: "Results Published", description: `Successfully published ${res.published} results.` });
          queryClient.invalidateQueries({ queryKey: getGetExamResultsQueryKey(activeExamId) });
        }
      });
    }
  };

  const anyUnpublished = results?.some(r => !r.isPublished);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Results Management</h2>
          <p className="text-muted-foreground mt-1">Review and publish exam scores.</p>
        </div>
        <div className="flex items-center gap-4">
          <Select 
            value={activeExamId?.toString() || ""} 
            onValueChange={(val) => setSelectedExamId(Number(val))}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select completed exam" />
            </SelectTrigger>
            <SelectContent>
              {exams?.map(e => (
                <SelectItem key={e.id} value={e.id.toString()}>{e.title}</SelectItem>
              ))}
              {(!exams || exams.length === 0) && (
                <SelectItem value="none" disabled>No completed exams</SelectItem>
              )}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handlePublish} 
            disabled={!activeExamId || !anyUnpublished || publishMut.isPending}
            className="gap-2"
          >
            <Share className="w-4 h-4" /> Publish All
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Award className="w-5 h-5" /> Submissions</CardTitle>
          <CardDescription>All student submissions for the selected exam.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!activeExamId ? (
            <div className="p-12 text-center text-muted-foreground">Select a completed exam to view results.</div>
          ) : isLoading ? (
            <div className="p-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results?.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">{result.studentName}</TableCell>
                    <TableCell>{new Date(result.submittedAt).toLocaleString()}</TableCell>
                    <TableCell>{result.totalScore}</TableCell>
                    <TableCell>{result.percentage}%</TableCell>
                    <TableCell>
                      <Badge variant={result.percentage >= 60 ? "default" : "destructive"}>
                        {result.grade}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={result.isPublished ? "outline" : "secondary"}>
                        {result.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(!results || results.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No results found for this exam.
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
