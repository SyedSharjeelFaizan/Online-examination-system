import { useParams, Link, useLocation } from "wouter";
import { useGetStudentExam, useStartExamSession, getGetStudentExamQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, BookOpen, AlertTriangle, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

export default function ExamDetail() {
  const { examId } = useParams();
  const id = Number(examId);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: exam, isLoading } = useGetStudentExam(id, {
    query: {
      enabled: !!id,
      queryKey: getGetStudentExamQueryKey(id)
    }
  });

  const startSession = useStartExamSession();

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!exam) {
    return <div>Exam not found</div>;
  }

  const handleStartExam = () => {
    startSession.mutate({ data: { examId: id } }, {
      onSuccess: (data) => {
        setLocation(`/student/exam/${data.sessionId}/start`);
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Cannot start exam",
          description: err.message || "Exam session could not be initiated."
        });
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <Link href="/student/exams" className="hover:text-foreground hover:underline">Exams</Link>
        <span>/</span>
        <span>{exam.title}</span>
      </div>

      <Card className="border-t-4 border-t-primary shadow-md">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl mb-2">{exam.title}</CardTitle>
              <CardDescription className="text-base">{exam.subject}</CardDescription>
            </div>
            <Badge variant={exam.status === "ONGOING" ? "destructive" : "secondary"} className="text-sm px-3 py-1">
              {exam.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-4">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4"/> Scheduled For</span>
              <p className="font-medium">{new Date(exam.scheduledAt).toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4"/> Duration</span>
              <p className="font-medium">{exam.durationMinutes} Minutes</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground flex items-center gap-2"><BookOpen className="w-4 h-4"/> Total Marks</span>
              <p className="font-medium">{exam.totalMarks}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Questions</span>
              <p className="font-medium">{exam.questionCount}</p>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Exam Configuration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 bg-background rounded border mt-0.5"><ShieldCheck className="w-4 h-4 text-primary" /></div>
                <div>
                  <p className="font-medium text-sm">Proctoring Enabled</p>
                  <p className="text-xs text-muted-foreground">Tab switching is strictly monitored.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 bg-background rounded border mt-0.5"><AlertTriangle className="w-4 h-4 text-amber-500" /></div>
                <div>
                  <p className="font-medium text-sm">Negative Marking</p>
                  <p className="text-xs text-muted-foreground">
                    {exam.negativeMarking ? `-${exam.negativeMarksValue} marks for incorrect answers.` : "No negative marking."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {exam.syllabusText && (
            <>
              <Separator className="my-6" />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Syllabus / Instructions</h3>
                <div className="prose dark:prose-invert max-w-none text-sm text-muted-foreground">
                  {exam.syllabusText.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="bg-muted/30 p-6 flex justify-between items-center border-t">
          <p className="text-sm text-muted-foreground">
            By starting this exam, you agree to the academic integrity guidelines.
          </p>
          <Button 
            size="lg" 
            onClick={handleStartExam} 
            disabled={exam.status === "COMPLETED" || startSession.isPending}
          >
            {startSession.isPending ? "Starting..." : "Start Exam"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
