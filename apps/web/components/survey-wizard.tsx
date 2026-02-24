"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  IconChevronRight,
  IconChevronLeft,
  IconPlus,
  IconTrash,
  IconStar,
  IconLetterT,
  IconList,
  IconCheck,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

type QuestionType = "star_rating" | "open_paragraph" | "multiple_choice";

interface Question {
  id: string;
  type: QuestionType;
  question: string;
  required: boolean;
  options?: string[];
}

export function SurveyWizard() {
  const router = useRouter();
  const createSurvey = useMutation(api.surveys.create);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Survey Data
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: uuidv4(),
      type,
      question: "",
      required: true,
      options:
        type === "multiple_choice" ? ["Option 1", "Option 2"] : undefined,
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, ...updates } : q)),
    );
  };

  const handleSave = async () => {
    if (!title) {
      toast.error("Please provide a survey title");
      setStep(1);
      return;
    }

    if (questions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }

    setLoading(true);
    try {
      await createSurvey({
        title,
        steps: questions,
      });
      toast.success("Survey created successfully!");
      router.push("/dashboard/surveys");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create survey");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full py-8">
      {/* Wizard Header - Steps Indicator */}
      <div className="flex items-center justify-center mb-12 relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-zinc-800 -translate-y-1/2 -z-10" />
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex flex-col items-center mx-12">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all border-2",
                step === s
                  ? "bg-emerald-500 border-emerald-500 text-white scale-110 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  : step > s
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-500"
                    : "bg-zinc-950 border-zinc-800 text-zinc-500",
              )}
            >
              {step > s ? <IconCheck className="size-5" /> : s}
            </div>
            <span
              className={cn(
                "mt-2 text-xs font-medium",
                step === s ? "text-emerald-500" : "text-zinc-500",
              )}
            >
              {s === 1 ? "Basics" : s === 2 ? "Questions" : "Finish"}
            </span>
          </div>
        ))}
      </div>

      <div className="min-h-[500px]">
        {/* Step 1: Basics */}
        {step === 1 && (
          <Card className="p-8 border-white/5 bg-zinc-950 rounded-3xl animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-white">
                  Let's name your survey
                </h2>
                <p className="text-zinc-400">
                  Give it a clear title that explains what you're asking about.
                </p>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="title"
                  className="text-sm font-medium text-zinc-300"
                >
                  Survey Title
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Workspace Experience Survey"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-14 bg-white/5 border-white/10 rounded-xl px-4 text-lg focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div className="pt-4 flex justify-end">
                <Button
                  onClick={() =>
                    title ? setStep(2) : toast.error("Please enter a title")
                  }
                  className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-12 px-8 font-bold"
                >
                  Continue
                  <IconChevronRight className="ml-2 size-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Step 2: Questions Builder */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-white">Builder</h2>
              <div className="flex gap-2">
                <Button
                  onClick={() => addQuestion("star_rating")}
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-white/10 hover:bg-emerald-500/10 hover:text-emerald-500"
                >
                  <IconStar className="size-4 mr-2" /> Star
                </Button>
                <Button
                  onClick={() => addQuestion("open_paragraph")}
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-white/10 hover:bg-blue-500/10 hover:text-blue-500"
                >
                  <IconLetterT className="size-4 mr-2" /> Text
                </Button>
                <Button
                  onClick={() => addQuestion("multiple_choice")}
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-white/10 hover:bg-purple-500/10 hover:text-purple-500"
                >
                  <IconList className="size-4 mr-2" /> List
                </Button>
              </div>
            </div>

            {questions.length === 0 ? (
              <Card className="p-12 border-dashed border-white/10 bg-zinc-950/50 flex flex-col items-center justify-center text-center rounded-3xl">
                <div className="p-3 bg-white/5 rounded-2xl mb-4">
                  <IconPlus className="size-8 text-zinc-500" />
                </div>
                <h3 className="text-zinc-300 font-semibold italic">
                  Add your first question to get started
                </h3>
              </Card>
            ) : (
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <Card
                    key={q.id}
                    className="p-6 border-white/5 bg-zinc-950 hover:border-emerald-500/20 transition-all rounded-2xl group relative"
                  >
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 size-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                      {idx + 1}
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg text-[10px] font-bold text-zinc-400 border border-white/5">
                            {q.type === "star_rating" && (
                              <IconStar className="size-3 text-emerald-500" />
                            )}
                            {q.type === "open_paragraph" && (
                              <IconLetterT className="size-3 text-blue-500" />
                            )}
                            {q.type === "multiple_choice" && (
                              <IconList className="size-3 text-purple-500" />
                            )}
                            {q.type.replace("_", " ").toUpperCase()}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeQuestion(q.id)}
                            className="size-8 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-red-500 hover:bg-red-500/10"
                          >
                            <IconTrash className="size-4" />
                          </Button>
                        </div>
                        <Input
                          placeholder="Your question here..."
                          value={q.question}
                          onChange={(e) =>
                            updateQuestion(q.id, { question: e.target.value })
                          }
                          className="border-none bg-transparent p-0 text-xl font-medium focus-visible:ring-0 placeholder:text-zinc-700"
                        />

                        {q.type === "multiple_choice" && (
                          <div className="space-y-2 pt-2">
                            <Label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                              Options
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                              {q.options?.map((option, optIdx) => (
                                <div
                                  key={optIdx}
                                  className="flex gap-2 group/opt"
                                >
                                  <Input
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [...(q.options || [])];
                                      newOptions[optIdx] = e.target.value;
                                      updateQuestion(q.id, {
                                        options: newOptions,
                                      });
                                    }}
                                    className="h-8 bg-white/5 border-white/5 rounded-lg text-xs"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const newOptions = q.options?.filter(
                                        (_, i) => i !== optIdx,
                                      );
                                      updateQuestion(q.id, {
                                        options: newOptions,
                                      });
                                    }}
                                    className="size-8 opacity-0 group-hover/opt:opacity-100 transition-opacity text-zinc-600 hover:text-red-500"
                                  >
                                    <IconTrash className="size-3" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  updateQuestion(q.id, {
                                    options: [
                                      ...(q.options || []),
                                      `Option ${(q.options?.length || 0) + 1}`,
                                    ],
                                  })
                                }
                                className="h-8 border-dashed border-white/10 bg-transparent text-xs text-zinc-500 hover:text-emerald-500 hover:border-emerald-500/50 rounded-lg"
                              >
                                <IconPlus className="size-3 mr-2" /> Add Option
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-8">
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                className="text-zinc-400 hover:text-white rounded-xl"
              >
                <IconChevronLeft className="mr-2 size-4" /> Back
              </Button>
              <Button
                onClick={() =>
                  questions.length > 0
                    ? setStep(3)
                    : toast.error("Add at least one question")
                }
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-12 px-8 font-bold"
              >
                Review
                <IconChevronRight className="ml-2 size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Finish */}
        {step === 3 && (
          <Card className="p-8 border-white/5 bg-zinc-950 rounded-3xl animate-in zoom-in-95">
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <div className="mx-auto size-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                  <IconCheck className="size-8 text-emerald-500" />
                </div>
                <h2 className="text-3xl font-bold text-white">
                  Ready to activate?
                </h2>
                <p className="text-zinc-400">
                  "{title}" with {questions.length} questions is ready for
                  launch.
                </p>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">
                  Preview
                </h3>
                <div className="space-y-4">
                  {questions.map((q, i) => (
                    <div key={q.id} className="flex gap-3 text-sm">
                      <span className="text-zinc-600">{i + 1}.</span>
                      <span className="text-zinc-300 font-medium">
                        {q.question || "Untitled Question"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setStep(2)}
                  className="text-zinc-400 hover:text-white rounded-xl"
                >
                  <IconChevronLeft className="mr-2 size-4" /> Changes
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-12 px-12 font-bold shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                >
                  {loading ? "Saving..." : "Create & Launch"}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
