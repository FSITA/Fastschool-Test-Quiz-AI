"use client";

import { useFormStore } from "@/store/form";
import Form from "./Form";
import Loading from "@/components/shared/Loading";
import { useEffect, useState } from "react";
import { useQuizStore } from "@/store/quiz";
import FormField from "./FormField";
import QuizDisplay from "./QuizDisplay";

export default function FormContainer() {
  const status = useFormStore((state) => state.status);
  const setStatus = useFormStore((state) => state.setStatus);
  const setQuizzes = useQuizStore((state) => state.setQuizzes);
  const reset = useQuizStore((state) => state.reset);
  const [streamContent, setStreamContent] = useState<string>("");

  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (status === "done") {
      try {
        // Clean up the content before parsing
        const cleanContent = streamContent.replace(/```json|```/g, "").trim();
        console.log("Attempting to parse JSON:", cleanContent.substring(0, 100) + "...");
        
        const data = JSON.parse(cleanContent);
        setQuizzes(data);
        setErrorMessage(""); // Clear any previous errors
      } catch (error) {
        console.error("JSON parsing error:", error);
        setErrorMessage("Error parsing quiz data. The API response was not in the expected format.");
        reset();
        setStreamContent("");
        setStatus("idle");
      }
    }
  }, [status, setQuizzes, reset, setStatus, streamContent]);

  async function generateQuiz(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("streaming");
    setStreamContent("");
    setErrorMessage(""); // Clear any previous errors

    const formData = new FormData(e.currentTarget);
    
    try {
      console.log("Sending request to generate quiz");
      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API error (${res.status}): ${errorText}`);
      }

      if (res.body) {
        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // Remove markdown code block syntax if present
            setStreamContent((prev) =>
              prev.replace("```json", "").replace("```", "")
            );
            setStatus("done");
            return;
          }
          setStreamContent((prev) => prev + value);
        }
      }

      setStatus("done");
    } catch (error) {
      console.error("Quiz generation error:", error);
      setErrorMessage(
        error instanceof Error 
          ? `Error generating quizzes: ${error.message}` 
          : "Error generating quizzes, try again!"
      );
      reset();
      setStreamContent("");
      setStatus("idle");
    }
  }

  return (
    <section>
      {status === "idle" && (
        <Form onSubmit={generateQuiz} />
      )}
      {status === "streaming" && <Loading />}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mt-4 max-w-lg mx-auto">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{errorMessage}</span>
          <p className="mt-2 text-sm">
            <a href="/api/debug" target="_blank" className="underline">Check API configuration</a> or 
            <a href="/api/test-gemini" target="_blank" className="underline ml-1">Test Gemini API</a>
          </p>
        </div>
      )}
      {status === "done" && <QuizDisplay />}
      {status === "done" && (
        <div className="flex justify-center mt-8 mb-16">
          <button
            onClick={() => setStatus("idle")}
            className="font-geistmono font-semibold tracking-widest bg-primary hover:bg-secondary duration-200 text-white rounded-full px-6 py-3"
          >
            Generate New Quiz
          </button>
        </div>
      )}
    </section>
  );
}
