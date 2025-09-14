import {
  HarmBlockThreshold,
  HarmCategory,
  VertexAI,
} from "@google-cloud/vertexai";
import { StreamingTextResponse } from "ai";
import { NextResponse } from "next/server";

// Add debugging to check if the API key is properly formatted
let credentials;
try {
  const decodedKey = Buffer.from(process.env.GOOGLE_SERVICE_KEY || "", "base64").toString();
  console.log("Decoded key format check:", decodedKey.substring(0, 20) + "...");
  credentials = JSON.parse(decodedKey);
} catch (error) {
  console.error("Error parsing API key:", error);
  // If the key is not in JSON format, it might be a direct API key
  credentials = { apiKey: process.env.GOOGLE_SERVICE_KEY };
}

// Initialize Vertex with your Cloud project and location
const vertex_ai = new VertexAI({
  // Extract project ID from credentials if available, otherwise use fallback
  project: credentials.project_id || "tough-pod-446502-n1", // Using project ID from the base64 key
  location: "europe-west3",
  googleAuthOptions: {
    credentials,
  },
});
const model = "gemini-2.5-flash";

// Instantiate the models
const generativeModel = vertex_ai.getGenerativeModel({
  model: model,
  generationConfig: {
    maxOutputTokens: 8192,
    temperature: 1,
    topP: 0.95,
  },
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
});

function iteratorToStream(iterator: any) {
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();

      if (done || !value) {
        controller.close();
      } else {
        const data = value.candidates[0].content.parts[0].text;

        // controller.enqueue(`data: ${data}\n\n`);
        controller.enqueue(data);
      }
    },
  });
}

export async function POST(req: Request) {
  try {
    console.log("Starting quiz generation request");
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const notes = formData.get("notes");
    const totalQuizQuestions = formData.get("quizCount");
    const difficulty = formData.get("difficulty");
    const topic = formData.get("topic");
    
    console.log("Form data received:", {
      filesCount: files.length,
      hasNotes: !!notes,
      totalQuizQuestions,
      difficulty,
      topic
    });

  if (files.length < 1 && !notes) {
    return new NextResponse("Please provide either a file or notes", {
      status: 400,
    });
  }

  const text1 = {
    text: `You are an all-rounder tutor with professional expertise in different fields. You are to generate a list of quiz questions from the document(s) with a difficutly of ${
      difficulty || "Easy"
    }.`,
  };
  const text2 = {
    text: `You response should be in JSON as an array of the object below. Respond with ${
      totalQuizQuestions || 5
    } different questions.
  {
   \"id\": 1,
   \"question\": \"\",
   \"description\": \"\",
   \"options\": {
     \"a\": \"\",
     \"b\": \"\",
     \"c\": \"\",
     \"d\": \"\"
   },
   \"answer\": \"\",
  }`,
  };

  const filesBase64 = await Promise.all(
    files.map(async (file) => {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      // return "data:" + file.type + ";base64," + buffer.toString("base64");
      return buffer.toString("base64");
    })
  );

  const filesData = filesBase64.map((b64, i) => ({
    inlineData: {
      mimeType: files[i].type,
      data: b64,
    },
  }));

  const data =
    files.length > 0 ? filesData : [{ text: notes?.toString() || "No notes" }];

  const body = {
    contents: [{ role: "user", parts: [text1, ...data, text2] }],
  };

  console.log("Sending request to Gemini API");
  try {
    const resp = await generativeModel.generateContentStream(body);
    console.log("Received response from Gemini API");

    // Convert the response into a friendly text-stream
    const stream = iteratorToStream(resp.stream);

    return new StreamingTextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Error generating content from Gemini API:", error);
    
    // Provide more specific error messages based on error type
    let errorMessage = "Error generating quizzes, try again!";
    let statusCode = 500;
    
    if (error instanceof Error) {
      // Check for permission errors
      if (error.message.includes("PERMISSION_DENIED") || error.message.includes("permission denied")) {
        errorMessage = "Permission denied accessing Google Cloud project. Please check your API key and project configuration.";
      }
      // Check for authentication errors
      else if (error.message.includes("authentication") || error.message.includes("auth") || error.message.includes("credential")) {
        errorMessage = "Authentication error with Google Cloud. Please check your API key format and permissions.";
      }
      // Check for quota errors
      else if (error.message.includes("quota") || error.message.includes("rate limit")) {
        errorMessage = "API quota exceeded or rate limited. Please try again later.";
      }
    }
    
    return new NextResponse(errorMessage, {
      status: statusCode,
    });
  }
} catch (error) {
  console.error("Unexpected error in quiz generation:", error);
  
  // Provide more specific error messages for the outer try-catch block
  let errorMessage = "Error generating quizzes, try again!";
  
  if (error instanceof Error) {
    // Check for common error types
    if (error.message.includes("PERMISSION_DENIED") || error.message.includes("permission denied")) {
      errorMessage = "Permission denied accessing Google Cloud project. Please check your API key and project configuration.";
    } else if (error.message.includes("authentication") || error.message.includes("auth")) {
      errorMessage = "Authentication error with Google Cloud. Please check your API key format.";
    } else if (error.message.includes("project")) {
      errorMessage = "Error with Google Cloud project configuration. Please check your project settings.";
    }
  }
  
  return new NextResponse(errorMessage, {
    status: 500,
  });
}
}
