import { NextResponse } from "next/server";
import { getSecret } from "@/lib/firebase/settings";

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return NextResponse.json({ error: "Missing imageUrl" }, { status: 400 });
    }

    const apiKey = await getSecret("gemini");
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured in Admin Settings" }, { status: 500 });
    }

    let mimeType = "image/jpeg";
    let base64Data = "";

    if (imageUrl.startsWith("data:")) {
      const matches = imageUrl.match(/^data:(.*?);base64,(.*)$/);
      if (matches && matches.length === 3) {
        mimeType = matches[1];
        base64Data = matches[2];
      }
    } else if (imageUrl.startsWith("http")) {
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error("Failed to fetch image URL");
      const arrayBuffer = await imgRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      base64Data = buffer.toString("base64");
      mimeType = imgRes.headers.get("content-type") || "image/jpeg";
    }

    if (!base64Data) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: "Analyze this artwork and return exactly 5 descriptive style tags (e.g., medium, lighting, mood, color palette, subject matter) as a comma-separated list. Output ONLY the comma-separated list, nothing else." },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini Error:", errorData);
      return NextResponse.json({ error: "Failed to analyze image with Gemini" }, { status: 500 });
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    const tags = resultText.split(",").map((t: string) => t.trim().toLowerCase());

    return NextResponse.json({ tags });

  } catch (error: any) {
    console.error("Vision API Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
