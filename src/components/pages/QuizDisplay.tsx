"use client";

import { useQuizStore } from "@/store/quiz";
import FormField from "./FormField";

export default function QuizDisplay() {
  const quizzes = useQuizStore((state) => state.quizzes);

  return (
    <FormField>
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl font-bold text-center mb-8">Generated Quizzes</h2>
        
        <div className="space-y-8">
          {quizzes.map((quiz, index) => (
            <div key={quiz.id} className="bg-white p-6 rounded-lg shadow-sm border border-zinc-100">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">Question {index + 1}</h3>
                <span className="bg-zinc-100 text-zinc-700 px-2 py-1 rounded text-xs font-medium">
                  Answer: {quiz.answer}
                </span>
              </div>
              
              <p className="text-zinc-800 mb-4">{quiz.question}</p>
              
              {quiz.description && (
                <p className="text-sm text-zinc-600 mb-4">{quiz.description}</p>
              )}
              
              <div className="space-y-2 mb-4">
                <h4 className="text-sm font-medium text-zinc-700">Options:</h4>
                <ul className="space-y-2">
                  {Object.entries(quiz.options).map(([key, value]) => (
                    <li 
                      key={`${quiz.id}-${key}`}
                      className={`flex items-center p-3 rounded-md ${key === quiz.answer ? 'bg-green-50 border border-green-100' : 'bg-zinc-50'}`}
                    >
                      <span className={`flex items-center justify-center w-6 h-6 rounded-full mr-3 text-xs font-medium ${key === quiz.answer ? 'bg-green-500 text-white' : 'bg-zinc-200 text-zinc-700'}`}>
                        {key.toUpperCase()}
                      </span>
                      <span className="text-sm">{value}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {quiz.resources && quiz.resources.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-zinc-700">Resources:</h4>
                  <ul className="text-xs text-blue-600">
                    {quiz.resources.map((resource, i) => (
                      <li key={i}>
                        <a href={resource.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {resource.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </FormField>
  );
}