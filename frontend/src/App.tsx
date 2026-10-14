import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import NotFound from "@/pages/not-found";

import Landing from "@/pages/public/Landing";
import Login from "@/pages/public/Login";
import Register from "@/pages/public/Register";

// Student
import StudentDashboard from "@/pages/student/Dashboard";
import StudentExams from "@/pages/student/Exams";
import StudentExamDetail from "@/pages/student/ExamDetail";
import StudentExamInterface from "@/pages/student/ExamInterface";
import StudentResults from "@/pages/student/Results";
import StudentResultDetail from "@/pages/student/ResultDetail";
import StudentAnalytics from "@/pages/student/Analytics";
import StudentNotifications from "@/pages/student/Notifications";

// Admin
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminExamsList from "@/pages/admin/ExamsList";
import AdminExamForm from "@/pages/admin/ExamForm";
import AdminAIGenerator from "@/pages/admin/AIGenerator";
import AdminQuestionBank from "@/pages/admin/QuestionBank";
import AdminStudents from "@/pages/admin/Students";
import AdminMonitor from "@/pages/admin/Monitor";
import AdminResults from "@/pages/admin/Results";
import AdminNotifications from "@/pages/admin/Notifications";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* EXAM INTERFACE IS FULLSCREEN, NO LAYOUT */}
      <Route path="/student/exam/:sessionId/start">
        <ProtectedRoute role="STUDENT">
          <StudentExamInterface />
        </ProtectedRoute>
      </Route>

      <Route path="/student/*">
        <ProtectedRoute role="STUDENT">
          <StudentLayout>
            <Switch>
              <Route path="/student/dashboard" component={StudentDashboard} />
              <Route path="/student/exams" component={StudentExams} />
              <Route path="/student/exams/:examId" component={StudentExamDetail} />
              <Route path="/student/results" component={StudentResults} />
              <Route path="/student/results/:resultId" component={StudentResultDetail} />
              <Route path="/student/analytics" component={StudentAnalytics} />
              <Route path="/student/notifications" component={StudentNotifications} />
              <Route component={NotFound} />
            </Switch>
          </StudentLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/*">
        <ProtectedRoute role="ADMIN">
          <AdminLayout>
            <Switch>
              <Route path="/admin/dashboard" component={AdminDashboard} />
              <Route path="/admin/exams" component={AdminExamsList} />
              <Route path="/admin/exams/create" component={AdminExamForm} />
              <Route path="/admin/exams/:examId/edit" component={AdminExamForm} />
              <Route path="/admin/ai-generator" component={AdminAIGenerator} />
              <Route path="/admin/questions" component={AdminQuestionBank} />
              <Route path="/admin/students" component={AdminStudents} />
              <Route path="/admin/monitor" component={AdminMonitor} />
              <Route path="/admin/results" component={AdminResults} />
              <Route path="/admin/notifications" component={AdminNotifications} />
              <Route component={NotFound} />
            </Switch>
          </AdminLayout>
        </ProtectedRoute>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
