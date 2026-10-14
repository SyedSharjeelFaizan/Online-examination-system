import { useGetMe, useListStudentExams, useGetStudentResults, useListNotifications, getGetStudentResultsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Award, Bell, Clock, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function StudentDashboard() {
  const { user: authUser } = useAuth();
  const { data: user, isLoading: userLoading } = useGetMe();
  const { data: exams, isLoading: examsLoading } = useListStudentExams();
  const studentId = authUser?.id ?? 0;
  const { data: results, isLoading: resultsLoading } = useGetStudentResults(studentId, {
    query: { enabled: !!authUser?.id, queryKey: getGetStudentResultsQueryKey(studentId) }
  });
  const { data: notifications, isLoading: notificationsLoading } = useListNotifications();

  if (userLoading || examsLoading || resultsLoading || notificationsLoading) {
    return <div className="flex h-full items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  const upcomingExams = exams?.filter(e => e.status === "PUBLISHED" || e.status === "ONGOING") || [];
  const recentResults = results?.slice(0, 3) || [];
  const unreadNotifications = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name?.split(' ')[0] || 'Student'}</h2>
        <p className="text-muted-foreground mt-1">Here's what's happening with your exams.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Exams</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingExams.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Exams</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{results?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {results?.length ? Math.round(results.reduce((acc, curr) => acc + curr.percentage, 0) / results.length) : 0}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadNotifications}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Upcoming & Active Exams</CardTitle>
            <CardDescription>
              Exams scheduled for you or currently ongoing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingExams.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                <p>No upcoming exams</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingExams.map((exam) => (
                  <div key={exam.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{exam.title}</p>
                      <p className="text-sm text-muted-foreground">{exam.subject} • {new Date(exam.scheduledAt).toLocaleDateString()}</p>
                    </div>
                    <Button asChild variant={exam.status === "ONGOING" ? "default" : "outline"}>
                      <Link href={`/student/exams/${exam.id}`}>
                        {exam.status === "ONGOING" ? "Start Now" : "View Details"}
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Results</CardTitle>
            <CardDescription>
              Your latest performance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <Award className="h-8 w-8 mb-2 opacity-50" />
                <p>No results yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentResults.map((result) => (
                  <div key={result.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{result.examTitle}</p>
                      <p className="text-sm text-muted-foreground">{new Date(result.submittedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{result.percentage}%</p>
                      <p className="text-xs text-muted-foreground">Grade {result.grade}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
