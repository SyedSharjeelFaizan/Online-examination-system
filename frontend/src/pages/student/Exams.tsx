import { useListStudentExams } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, BookOpen, AlertCircle } from "lucide-react";

export default function Exams() {
  const { data: exams, isLoading } = useListStudentExams();

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  const activeExams = exams?.filter(e => e.status === "ONGOING") || [];
  const upcomingExams = exams?.filter(e => e.status === "PUBLISHED") || [];
  const pastExams = exams?.filter(e => e.status === "COMPLETED") || [];

  const ExamCard = ({ exam }: { exam: any }) => (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <Badge variant={exam.status === "ONGOING" ? "destructive" : exam.status === "PUBLISHED" ? "default" : "secondary"}>
            {exam.status}
          </Badge>
          <Badge variant="outline">{exam.examType}</Badge>
        </div>
        <CardTitle className="line-clamp-2">{exam.title}</CardTitle>
        <CardDescription>{exam.subject}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{new Date(exam.scheduledAt).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{exam.durationMinutes} mins</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span>{exam.totalMarks} marks • {exam.questionCount} questions</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full" variant={exam.status === "ONGOING" ? "default" : "outline"}>
          <Link href={`/student/exams/${exam.id}`}>
            {exam.status === "ONGOING" ? "Enter Exam" : "View Details"}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Available Exams</h2>
        <p className="text-muted-foreground mt-1">View and manage your upcoming and active assessments.</p>
      </div>

      {activeExams.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" /> Ongoing Now
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeExams.map(exam => <ExamCard key={exam.id} exam={exam} />)}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Upcoming</h3>
        {upcomingExams.length === 0 ? (
          <p className="text-muted-foreground bg-muted/50 p-8 rounded-lg text-center border border-dashed">No upcoming exams scheduled.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingExams.map(exam => <ExamCard key={exam.id} exam={exam} />)}
          </div>
        )}
      </div>

      {pastExams.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Past Exams</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pastExams.map(exam => <ExamCard key={exam.id} exam={exam} />)}
          </div>
        </div>
      )}
    </div>
  );
}
