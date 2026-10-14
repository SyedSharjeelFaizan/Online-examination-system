import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateExam, useGetAdminExam, useUpdateExam, getGetAdminExamQueryKey } from "@workspace/api-client-react";
import { CreateExamRequestExamType, CreateExamRequestDifficulty } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const examSchema = z.object({
  title: z.string().min(3, "Title is required"),
  subject: z.string().min(2, "Subject is required"),
  department: z.string().optional(),
  semester: z.coerce.number().optional(),
  durationMinutes: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  totalMarks: z.coerce.number().min(1, "Total marks required"),
  scheduledAt: z.string(),
  examType: z.nativeEnum(CreateExamRequestExamType),
  difficulty: z.nativeEnum(CreateExamRequestDifficulty).optional(),
  isAdaptive: z.boolean(),
  voiceModeEnabled: z.boolean(),
  negativeMarking: z.boolean(),
  negativeMarksValue: z.coerce.number(),
  syllabusText: z.string().optional(),
});

export default function ExamForm() {
  const { examId } = useParams();
  const isEdit = !!examId;
  const id = Number(examId);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: examData, isLoading: isLoadingExam } = useGetAdminExam(id, {
    query: {
      enabled: isEdit,
      queryKey: getGetAdminExamQueryKey(id)
    }
  });

  const createExam = useCreateExam();
  const updateExam = useUpdateExam();

  const form = useForm<z.infer<typeof examSchema>>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: "",
      subject: "",
      department: "",
      semester: 1,
      durationMinutes: 60,
      totalMarks: 100,
      scheduledAt: new Date().toISOString().slice(0, 16),
      examType: "MCQ",
      difficulty: "MEDIUM",
      isAdaptive: false,
      voiceModeEnabled: false,
      negativeMarking: false,
      negativeMarksValue: 0,
      syllabusText: "",
    },
  });

  useEffect(() => {
    if (isEdit && examData) {
      form.reset({
        title: examData.title,
        subject: examData.subject,
        department: examData.department || "",
        semester: examData.semester || 1,
        durationMinutes: examData.durationMinutes,
        totalMarks: examData.totalMarks,
        scheduledAt: new Date(examData.scheduledAt).toISOString().slice(0, 16),
        examType: examData.examType as any,
        difficulty: examData.difficulty as any,
        isAdaptive: examData.isAdaptive,
        voiceModeEnabled: examData.voiceModeEnabled,
        negativeMarking: examData.negativeMarking,
        negativeMarksValue: examData.negativeMarksValue,
        syllabusText: (examData as any).syllabusText || "",
      });
    }
  }, [isEdit, examData, form]);

  const onSubmit = (values: z.infer<typeof examSchema>) => {
    const payload = {
      ...values,
      scheduledAt: new Date(values.scheduledAt).toISOString(),
      questionIds: [] // handled separately or not at all in this simple form
    };

    if (isEdit) {
      updateExam.mutate({ examId: id, data: payload }, {
        onSuccess: () => {
          toast({ title: "Exam updated successfully" });
          setLocation("/admin/exams");
        },
        onError: (err) => {
          toast({ variant: "destructive", title: "Update failed", description: err.message });
        }
      });
    } else {
      createExam.mutate({ data: payload }, {
        onSuccess: () => {
          toast({ title: "Exam created successfully" });
          setLocation("/admin/exams");
        },
        onError: (err) => {
          toast({ variant: "destructive", title: "Creation failed", description: err.message });
        }
      });
    }
  };

  if (isEdit && isLoadingExam) {
    return <div className="flex h-full items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  const isPending = createExam.isPending || updateExam.isPending;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/admin/exams" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Exams
        </Link>
      </div>

      <div>
        <h2 className="text-3xl font-bold tracking-tight">{isEdit ? 'Edit Exam' : 'Create New Exam'}</h2>
        <p className="text-muted-foreground mt-1">Configure exam parameters and settings.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Exam Title</FormLabel>
                  <FormControl><Input placeholder="Midterm Examination" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="subject" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject Code / Name</FormLabel>
                    <FormControl><Input placeholder="CS101" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="examType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exam Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="MCQ">MCQ Only</SelectItem>
                        <SelectItem value="CODING">Coding Only</SelectItem>
                        <SelectItem value="MIXED">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="department" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department Target (Optional)</FormLabel>
                    <FormControl><Input placeholder="CSE" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="semester" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Semester Target (Optional)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scheduling & Marking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="scheduledAt" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date & Time</FormLabel>
                    <FormControl><Input type="datetime-local" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="durationMinutes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (Minutes)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="totalMarks" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Marks</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="difficulty" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select difficulty" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="EASY">Easy</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HARD">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="isAdaptive" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Adaptive Testing</FormLabel>
                    <FormDescription>Questions scale based on student performance.</FormDescription>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="voiceModeEnabled" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Voice Mode</FormLabel>
                    <FormDescription>Allow students to answer via speech-to-text.</FormDescription>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />

              <div className="flex gap-4">
                <FormField control={form.control} name="negativeMarking" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 flex-1">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Negative Marking</FormLabel>
                      <FormDescription>Deduct marks for incorrect answers.</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />

                {form.watch("negativeMarking") && (
                  <FormField control={form.control} name="negativeMarksValue" render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Penalty Value</FormLabel>
                      <FormControl><Input type="number" step="0.5" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
              </div>

              <FormField control={form.control} name="syllabusText" render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructions / Syllabus</FormLabel>
                  <FormControl><Textarea placeholder="Enter exam instructions or syllabus topics..." className="h-32" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild><Link href="/admin/exams">Cancel</Link></Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : isEdit ? "Update Exam" : "Create Exam"}</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
