import { useListQuestions, getListQuestionsQueryKey, useDeleteQuestion } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Filter } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function QuestionBank() {
  const queryClient = useQueryClient();
  const { data: questions, isLoading } = useListQuestions({}, {
    query: {
      queryKey: getListQuestionsQueryKey({})
    }
  });

  const deleteMut = useDeleteQuestion();

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this question?")) {
      deleteMut.mutate({ questionId: id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListQuestionsQueryKey({}) });
        }
      });
    }
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Question Bank</h2>
          <p className="text-muted-foreground mt-1">Manage all system questions across subjects.</p>
        </div>
        <Button variant="outline"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">Question</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions?.map((q) => (
                <TableRow key={q.id}>
                  <TableCell>
                    <p className="font-medium line-clamp-2">{q.questionText}</p>
                    {q.isAiGenerated && <Badge variant="outline" className="mt-1 text-[10px] bg-primary/5 text-primary border-primary/20">AI Generated</Badge>}
                  </TableCell>
                  <TableCell><Badge variant="secondary">{q.questionType}</Badge></TableCell>
                  <TableCell>{q.subject || 'General'}</TableCell>
                  <TableCell>{q.difficulty}</TableCell>
                  <TableCell>{q.marks}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(q.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {questions?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No questions found in the bank.
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
