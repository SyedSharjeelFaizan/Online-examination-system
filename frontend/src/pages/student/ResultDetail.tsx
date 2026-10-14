import { useGetResult, getGetResultQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle2, XCircle, Code } from "lucide-react";

export default function ResultDetail() {
  const { resultId } = useParams();
  const id = Number(resultId);

  const { data: result, isLoading } = useGetResult(id, {
    query: {
      enabled: !!id,
      queryKey: getGetResultQueryKey(id)
    }
  });

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!result) {
    return <div>Result not found</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/student/results" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Results
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-2xl">{result.examTitle}</CardTitle>
            <CardDescription>Submitted on {new Date(result.submittedAt).toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y my-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Score</p>
                <p className="text-2xl font-bold">{result.totalScore}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Percentage</p>
                <p className="text-2xl font-bold">{result.percentage}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Grade</p>
                <p className="text-2xl font-bold">{result.grade}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">MCQ Score</p>
                <p className="text-2xl font-bold">{result.mcqScore}</p>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Question Breakdown</h3>
              <div className="space-y-4">
                {result.answers?.map((ans, idx) => (
                  <div key={ans.questionId} className="p-4 border rounded-lg bg-card">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">
                          <span className="text-muted-foreground mr-2">Q{idx + 1}.</span>
                          {ans.questionText}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">{ans.questionType}</Badge>
                          {ans.questionType === "CODING" && ans.testCasesTotal !== null && (
                            <span className="text-xs text-muted-foreground">
                              Test Cases: {ans.testCasesPassed}/{ans.testCasesTotal}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className={`flex items-center gap-1 font-bold ${ans.scoreObtained > 0 ? (ans.scoreObtained === ans.maxMarks ? 'text-green-500' : 'text-amber-500') : 'text-red-500'}`}>
                          {ans.scoreObtained === ans.maxMarks ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          {ans.scoreObtained} / {ans.maxMarks}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Performance</span>
                <span className="font-medium">{result.percentage}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-3">
                <div className="bg-primary h-3 rounded-full" style={{ width: `${result.percentage}%` }} />
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Published</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coding Score</span>
                <span className="font-medium">{result.codingScore}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
