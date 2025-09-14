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
    let decodedKey = "";
    try {
      decodedKey = Buffer.from(process.env.GOOGLE_SERVICE_KEY || "", "base64").toString();
      console.log("Decoded key format check:", decodedKey.substring(0, 20) + "...");
      credentials = JSON.parse(decodedKey);
    } catch (error) {
      console.error("Error parsing API key:", error);
      // If the key is not in JSON format, it might be a direct API key
      credentials = { apiKey: process.env.GOOGLE_SERVICE_KEY };
    }

    // Return information about the API key format
    return NextResponse.json({
      status: "API Key Check",
      isBase64: decodedKey.startsWith("{"),
      keyType: typeof credentials === "object" ? "JSON object" : "string",
      keyFormat: decodedKey.startsWith("{") ? "Appears to be JSON" : "Not JSON format",
      keyPreview: process.env.GOOGLE_SERVICE_KEY?.substring(0, 10) + "...",
      message: "This endpoint helps debug API key issues. Check the console logs for more details."
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json({
      status: "error",
      message: "Error checking API key",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}