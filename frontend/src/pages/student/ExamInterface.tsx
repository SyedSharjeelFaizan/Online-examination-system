import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { 
  useGetExamSession, 
  useSaveAnswer, 
  useSubmitExam, 
  useFlagViolation, 
  useRunCode, 
  useSubmitCode,
  getGetExamSessionQueryKey 
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AlertTriangle, Clock, Mic, Save, Send, ShieldAlert, Monitor, Terminal } from "lucide-react";
import Editor from "@monaco-editor/react";

export default function ExamInterface() {
  const { sessionId } = useParams();
  const id = Number(sessionId);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState("python");
  const [codeOutput, setCodeOutput] = useState<string | null>(null);

  // API Hooks
  const { data: session, isLoading, isError } = useGetExamSession(id, {
    query: {
      enabled: !!id,
      queryKey: getGetExamSessionQueryKey(id),
      refetchOnWindowFocus: false,
    }
  });

  const saveAnswer = useSaveAnswer();
  const submitExam = useSubmitExam();
  const flagViolation = useFlagViolation();
  const runCode = useRunCode();
  const submitCode = useSubmitCode();

  const autoSaveInterval = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const timerInterval = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const recognitionRef = useRef<any>(null);

  // Initialize session data
  useEffect(() => {
    if (session) {
      if (timeLeft === null) {
        setTimeLeft(session.timeRemainingSeconds);
      }
      
      // Initialize answers state from saved answers
      if (Object.keys(answers).length === 0 && session.savedAnswers) {
        const initialAnswers: Record<number, any> = {};
        session.savedAnswers.forEach(sa => {
          initialAnswers[sa.questionId] = {
            selectedOptionId: sa.selectedOptionId,
            codeSubmission: sa.codeSubmission,
            language: sa.language || "python",
            isMarkedReview: sa.isMarkedReview
          };
        });
        setAnswers(initialAnswers);
      }

      // Enter fullscreen
      const enterFullscreen = async () => {
        try {
          if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
          }
        } catch (err) {
          console.error("Fullscreen error:", err);
        }
      };
      enterFullscreen();
    }
  }, [session]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0) {
      timerInterval.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev !== null && prev <= 1) {
            clearInterval(timerInterval.current);
            handleFinalSubmit();
            return 0;
          }
          return prev !== null ? prev - 1 : 0;
        });
      }, 1000);
    }

    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [timeLeft]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!session) return;
    
    autoSaveInterval.current = setInterval(() => {
      handleAutoSave();
    }, 30000);

    return () => {
      if (autoSaveInterval.current) clearInterval(autoSaveInterval.current);
    };
  }, [answers, session, currentQuestionIndex]);

  // Tab switch detection
  useEffect(() => {
    if (!session) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        flagViolation.mutate({ data: { sessionId: session.sessionId } }, {
          onSuccess: (res) => {
            toast({
              variant: "destructive",
              title: "Violation Detected",
              description: `Tab switch detected. Count: ${res.tabSwitchCount}`,
            });
            if (res.autoSubmitted) {
              toast({
                variant: "destructive",
                title: "Exam Auto-Submitted",
                description: "Maximum violations reached. Exam submitted.",
              });
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
              }
              setLocation(`/student/results/${res.resultId}`);
            }
          }
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [session, flagViolation, setLocation, toast]);

  // Voice mode setup
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join('');
        
        // Voice commands could be implemented here to select options
        console.log("Voice transcript:", transcript);
      };
    }
  }, []);

  const handleAutoSave = useCallback(() => {
    if (!session) return;
    const currentQ = session.questions[currentQuestionIndex];
    if (!currentQ) return;
    
    const answer = answers[currentQ.id];
    if (!answer) return;

    saveAnswer.mutate({
      data: {
        sessionId: session.sessionId,
        questionId: currentQ.id,
        selectedOptionId: answer.selectedOptionId,
        codeSubmission: answer.codeSubmission,
        language: answer.language,
        isMarkedReview: answer.isMarkedReview || false
      }
    });
  }, [answers, session, currentQuestionIndex, saveAnswer]);

  const handleFinalSubmit = () => {
    if (!session) return;
    
    // Save current answer first
    handleAutoSave();

    submitExam.mutate({ data: { sessionId: session.sessionId } }, {
      onSuccess: () => {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setLocation("/student/results");
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Submission failed",
          description: err.message
        });
      }
    });
  };

  const handleOptionSelect = (optionId: number) => {
    if (!session) return;
    const currentQ = session.questions[currentQuestionIndex];
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        selectedOptionId: optionId
      }
    }));
  };

  const handleCodeChange = (value: string | undefined) => {
    if (!session) return;
    const currentQ = session.questions[currentQuestionIndex];
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        codeSubmission: value || "",
        language: codeLanguage
      }
    }));
  };

  const toggleMarkReview = () => {
    if (!session) return;
    const currentQ = session.questions[currentQuestionIndex];
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        isMarkedReview: !prev[currentQ.id]?.isMarkedReview
      }
    }));
  };

  const executeCode = () => {
    if (!session) return;
    const currentQ = session.questions[currentQuestionIndex];
    const answer = answers[currentQ.id];
    
    if (!answer?.codeSubmission) return;
    
    setCodeOutput("Running...");
    
    runCode.mutate({
      data: {
        code: answer.codeSubmission,
        language: answer.language || codeLanguage,
      }
    }, {
      onSuccess: (res) => {
        setCodeOutput(res.output || res.error || "Execution completed with no output");
      },
      onError: (err) => {
        setCodeOutput(`Error: ${err.message}`);
      }
    });
  };

  const toggleVoiceMode = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (isError || !session) return <div className="p-8 text-center text-destructive">Failed to load exam session.</div>;

  const currentQ = session.questions[currentQuestionIndex];
  const currentAnswer = answers[currentQ?.id] || {};

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden select-none">
      {/* Top Bar */}
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-bold tracking-tight text-primary">ExamForge</h1>
          <div className="h-4 w-px bg-border"></div>
          <span className="text-sm font-medium text-muted-foreground">{user?.name}</span>
          <div className="h-4 w-px bg-border"></div>
          <span className="text-sm font-medium">{session.examId}</span>
        </div>
        
        <div className="flex items-center gap-6">
          {isRecording && (
            <div className="flex items-center gap-2 text-destructive animate-pulse">
              <Mic className="w-4 h-4" />
              <span className="text-sm font-medium">Voice Active</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md font-mono text-lg font-bold">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className={timeLeft && timeLeft < 300 ? "text-destructive animate-pulse" : ""}>
              {timeLeft !== null ? formatTime(timeLeft) : "--:--:--"}
            </span>
          </div>
          
          <Button variant="destructive" onClick={() => setShowSubmitConfirm(true)}>
            Submit Exam
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left/Main Panel - Question Area */}
        <div className="flex-1 flex flex-col border-r border-border bg-background overflow-hidden">
          <div className="p-6 border-b border-border bg-card/50 flex items-center justify-between">
            <h2 className="text-xl font-bold">Question {currentQuestionIndex + 1} <span className="text-muted-foreground text-base font-normal ml-2">of {session.questions.length}</span></h2>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium px-2 py-1 bg-muted rounded text-muted-foreground">
                Marks: {currentQ.marks}
              </span>
              <span className="text-sm font-medium px-2 py-1 bg-muted rounded text-muted-foreground">
                {currentQ.questionType}
              </span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="prose dark:prose-invert max-w-none mb-8 text-lg">
              <p>{currentQ.questionText}</p>
            </div>

            {currentQ.questionType === "MCQ" ? (
              <RadioGroup 
                value={currentAnswer.selectedOptionId?.toString() || ""} 
                onValueChange={(val) => handleOptionSelect(Number(val))}
                className="space-y-4"
              >
                {currentQ.options.map((opt) => (
                  <div key={opt.id} className={`flex items-center space-x-3 border p-4 rounded-lg cursor-pointer transition-colors ${currentAnswer.selectedOptionId === opt.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`} onClick={() => handleOptionSelect(opt.id)}>
                    <RadioGroupItem value={opt.id.toString()} id={`opt-${opt.id}`} />
                    <Label htmlFor={`opt-${opt.id}`} className="flex-1 cursor-pointer text-base leading-relaxed">{opt.optionLabel}. {opt.optionText}</Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="flex flex-col h-[500px] border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-2 border-b bg-card">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCodeLanguage("python")} className={codeLanguage === "python" ? "bg-primary text-primary-foreground" : ""}>Python</Button>
                    <Button variant="outline" size="sm" onClick={() => setCodeLanguage("javascript")} className={codeLanguage === "javascript" ? "bg-primary text-primary-foreground" : ""}>JavaScript</Button>
                    <Button variant="outline" size="sm" onClick={() => setCodeLanguage("cpp")} className={codeLanguage === "cpp" ? "bg-primary text-primary-foreground" : ""}>C++</Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={executeCode} disabled={runCode.isPending}>
                      <Terminal className="w-4 h-4 mr-2" /> Run Code
                    </Button>
                  </div>
                </div>
                <div className="flex-1">
                  <Editor
                    height="100%"
                    language={codeLanguage}
                    theme="vs-dark"
                    value={currentAnswer.codeSubmission || ""}
                    onChange={handleCodeChange}
                    options={{ minimap: { enabled: false }, fontSize: 14 }}
                  />
                </div>
                {codeOutput && (
                  <div className="h-40 border-t bg-black p-4 font-mono text-sm text-green-400 overflow-y-auto">
                    <div className="text-gray-400 mb-2">Output:</div>
                    <pre>{codeOutput}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Bottom Bar Controls */}
          <div className="p-4 border-t border-border bg-card flex justify-between items-center shrink-0">
            <div className="flex gap-2">
              <Button variant="outline" onClick={toggleMarkReview} className={currentAnswer.isMarkedReview ? 'border-amber-500 text-amber-500 bg-amber-500/10' : ''}>
                <AlertTriangle className="w-4 h-4 mr-2" />
                {currentAnswer.isMarkedReview ? 'Marked for Review' : 'Mark for Review'}
              </Button>
              <Button variant="outline" onClick={() => {
                 setAnswers(prev => ({ ...prev, [currentQ.id]: { ...prev[currentQ.id], selectedOptionId: undefined, codeSubmission: undefined } }));
              }}>
                Clear Response
              </Button>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                onClick={() => {
                  handleAutoSave();
                  setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
                }}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              <Button 
                onClick={() => {
                  handleAutoSave();
                  if (currentQuestionIndex < session.questions.length - 1) {
                    setCurrentQuestionIndex(currentQuestionIndex + 1);
                  } else {
                    setShowSubmitConfirm(true);
                  }
                }}
              >
                {currentQuestionIndex === session.questions.length - 1 ? 'Save & Submit' : 'Save & Next'}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel - Palette */}
        <div className="w-80 bg-card flex flex-col shrink-0">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold mb-4">Question Palette</h3>
            <div className="grid grid-cols-5 gap-2">
              {session.questions.map((q, idx) => {
                const ans = answers[q.id];
                const isCurrent = currentQuestionIndex === idx;
                const isAnswered = ans?.selectedOptionId || (ans?.codeSubmission && ans.codeSubmission.trim().length > 0);
                const isReview = ans?.isMarkedReview;
                
                let bgColor = "bg-muted text-muted-foreground border-transparent";
                if (isCurrent) bgColor = "bg-primary text-primary-foreground border-primary";
                else if (isReview && isAnswered) bgColor = "bg-amber-500 text-white border-amber-500";
                else if (isReview) bgColor = "bg-amber-500/20 text-amber-500 border-amber-500";
                else if (isAnswered) bgColor = "bg-green-500 text-white border-green-500";

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      handleAutoSave();
                      setCurrentQuestionIndex(idx);
                    }}
                    className={`h-10 w-10 rounded font-medium border flex items-center justify-center transition-all hover:opacity-80 ${bgColor}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="p-4 space-y-3 text-sm text-muted-foreground flex-1">
            <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-primary"></div> Current</div>
            <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-green-500"></div> Answered</div>
            <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-amber-500"></div> Marked for Review</div>
            <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-muted border"></div> Unanswered</div>
          </div>

          {/* Voice Mode Toggle */}
          <div className="p-4 border-t border-border">
            <Button 
              variant={isRecording ? "destructive" : "outline"} 
              className="w-full"
              onClick={toggleVoiceMode}
            >
              <Mic className="w-4 h-4 mr-2" />
              {isRecording ? "Stop Voice Mode" : "Enable Voice Mode"}
            </Button>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit your exam? You will not be able to change your answers after submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalSubmit} disabled={submitExam.isPending}>
              {submitExam.isPending ? "Submitting..." : "Yes, Submit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
