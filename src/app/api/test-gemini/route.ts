import { NextResponse } from "next/server";
import {
  HarmBlockThreshold,
  HarmCategory,
  VertexAI,
} from "@google-cloud/vertexai";

export async function GET() {
  try {
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
        maxOutputTokens: 100,
        temperature: 1,
        topP: 0.95,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    // Simple test prompt
    const body = {
      contents: [{ role: "user", parts: [{ text: "Say hello in JSON format" }] }],
    };

    console.log("Sending test request to Gemini API");
    const response = await generativeModel.generateContent(body);
    console.log("Received test response from Gemini API");
    
    // Add null/undefined checks to fix TypeScript error
    const responseText = response.response?.candidates?.[0]?.content?.parts?.[0]?.text || "No response text";
    
    return NextResponse.json({
      status: "success",
      message: "Gemini API test successful",
      response: responseText
    });
  } catch (error) {
    console.error("Test endpoint error:", error);
    return NextResponse.json({
      status: "error",
      message: "Error testing Gemini API",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}