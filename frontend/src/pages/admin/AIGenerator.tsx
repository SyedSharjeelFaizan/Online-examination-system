import { useState } from "react";
import { useGenerateAiQuestions, useCreateQuestion } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BrainCircuit, Check, X, Wand2 } from "lucide-react";
import { AiGenerateRequestDifficulty, AiGenerateRequestQuestionType } from "@workspace/api-client-react";

export default function AIGenerator() {
  const { toast } = useToast();
  const generateMut = useGenerateAiQuestions();
  const createMut = useCreateQuestion();

  const [formData, setFormData] = useState({
    syllabusText: "",
    subject: "",
    topic: "",
    difficulty: "MEDIUM" as AiGenerateRequestDifficulty,
    questionType: "MCQ" as AiGenerateRequestQuestionType,
    count: 3
  });

  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);

  const handleGenerate = () => {
    if (!formData.syllabusText || !formData.subject) {
      toast({ variant: "destructive", title: "Validation Error", description: "Syllabus and Subject are required." });
      return;
    }
    
    generateMut.mutate({ data: formData }, {
      onSuccess: (res) => {
        setGeneratedQuestions(res.questions);
        toast({ title: "Questions generated successfully" });
      },
      onError: (err) => {
        toast({ variant: "destructive", title: "Generation failed", description: err.message });
      }
    });
  };

  const handleAccept = (q: any, index: number) => {
    const payload: any = {
      questionText: q.questionText,
      questionType: q.questionType,
      difficulty: q.difficulty,
      marks: q.difficulty === "HARD" ? 5 : q.difficulty === "MEDIUM" ? 3 : 1,
      topic: q.topic,
      subject: q.subject,
      isAiGenerated: true,
    };

    if (q.questionType === "MCQ" && q.options) {
      payload.options = q.options;
    } else if (q.questionType === "CODING" && q.testCases) {
      payload.testCases = q.testCases.map((tc: any) => ({
        ...tc,
        marksWeightage: 1
      }));
    }

    createMut.mutate({ data: payload }, {
      onSuccess: () => {
        toast({ title: "Question added to bank" });
        setGeneratedQuestions(prev => prev.filter((_, i) => i !== index));
      },
      onError: (err) => {
        toast({ variant: "destructive", title: "Failed to save", description: err.message });
      }
    });
  };

  const handleReject = (index: number) => {
    setGeneratedQuestions(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">AI Question Generator</h2>
        <p className="text-muted-foreground mt-1">Generate high-quality exam questions from syllabus or text.</p>
      </div>

      <div className="grid md:grid-cols-12 gap-6">
        <Card className="md:col-span-4 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wand2 className="w-5 h-5 text-primary" /> Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder="Data Structures" />
            </div>
            <div className="space-y-2">
              <Label>Topic</Label>
              <Input value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} placeholder="Binary Trees" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.questionType} onValueChange={(v: any) => setFormData({...formData, questionType: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MCQ">MCQ</SelectItem>
                    <SelectItem value="CODING">Coding</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={formData.difficulty} onValueChange={(v: any) => setFormData({...formData, difficulty: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">Easy</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HARD">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Count (1-5)</Label>
              <Input type="number" min={1} max={5} value={formData.count} onChange={e => setFormData({...formData, count: Number(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label>Source Text / Syllabus</Label>
              <Textarea 
                className="h-40" 
                placeholder="Paste paragraph, syllabus, or concept here..." 
                value={formData.syllabusText} 
                onChange={e => setFormData({...formData, syllabusText: e.target.value})}
              />
            </div>
            <Button className="w-full mt-4" onClick={handleGenerate} disabled={generateMut.isPending}>
              {generateMut.isPending ? "Generating..." : "Generate Questions"}
            </Button>
          </CardContent>
        </Card>

        <div className="md:col-span-8 space-y-4">
          {generatedQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] border border-dashed rounded-lg bg-card/50 text-muted-foreground">
              <BrainCircuit className="w-12 h-12 mb-4 opacity-20" />
              <p>Configure parameters and generate questions to see them here.</p>
            </div>
          ) : (
            generatedQuestions.map((q, index) => (
              <Card key={index} className="border-l-4 border-l-primary">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex gap-2 mb-2 text-xs font-medium">
                      <span className="px-2 py-1 bg-muted rounded">{q.questionType}</span>
                      <span className="px-2 py-1 bg-muted rounded">{q.difficulty}</span>
                      <span className="px-2 py-1 bg-muted rounded">{q.topic}</span>
                    </div>
                  </div>
                  <p className="text-lg font-medium mb-4">{q.questionText}</p>
                  
                  {q.questionType === "MCQ" && q.options && (
                    <div className="space-y-2 mb-4">
                      {q.options.map((opt: any, i: number) => (
                        <div key={i} className={`p-3 border rounded text-sm ${opt.isCorrect ? 'border-green-500 bg-green-500/10' : 'bg-muted/50'}`}>
                          <span className="font-semibold mr-2">{opt.label}.</span>
                          {opt.text}
                          {opt.isCorrect && <Check className="w-4 h-4 text-green-500 inline ml-2" />}
                        </div>
                      ))}
                    </div>
                  )}

                  {q.questionType === "CODING" && q.testCases && (
                    <div className="space-y-2 mb-4">
                      <p className="text-sm font-semibold">Generated Test Cases:</p>
                      {q.testCases.map((tc: any, i: number) => (
                        <div key={i} className="p-3 border bg-muted/30 rounded text-sm font-mono">
                          <div><span className="text-muted-foreground">In:</span> {tc.input}</div>
                          <div><span className="text-muted-foreground">Out:</span> {tc.expectedOutput}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {q.explanation && (
                    <div className="p-3 bg-primary/5 text-primary text-sm rounded mt-4">
                      <span className="font-semibold">Explanation:</span> {q.explanation}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-muted/30 p-4 flex justify-end gap-2">
                  <Button variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleReject(index)}>
                    <X className="w-4 h-4 mr-2" /> Discard
                  </Button>
                  <Button onClick={() => handleAccept(q, index)}>
                    <Check className="w-4 h-4 mr-2" /> Add to Bank
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
