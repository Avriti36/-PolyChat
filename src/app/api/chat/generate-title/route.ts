import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { OPENROUTER_BASE, openRouterHeaders } from "@/lib/openrouter/client";

export async function POST(req: NextRequest) {
  try {
    const { chat_id, first_message } = await req.json();

    // Validate required fields
    if (!chat_id || !first_message) {
      return NextResponse.json(
        { error: "Missing chat_id or first_message", code: "INVALID_REQUEST" },
        { status: 400 },
      );
    }

    // Validate first_message is not empty after trimming
    const trimmedMessage = first_message.trim();
    if (!trimmedMessage) {
      return NextResponse.json(
        { error: "first_message cannot be empty", code: "INVALID_REQUEST" },
        { status: 400 },
      );
    }

    // Make the API call to OpenRouter
    const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: openRouterHeaders,
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free",
        messages: [
          {
            role: "user",
            content: `Generate a short 4-6 word title for a chat that starts with: "${trimmedMessage}". Reply with ONLY the title, no quotes, no punctuation.`,
          },
        ],
        max_tokens: 20,
      }),
    });

    // Check if the response is not ok
    if (!response.ok) {
      console.error(
        "OpenRouter API error:",
        response.status,
        await response.text(),
      );
      // Don't fail completely - just keep the existing title or use default
      return NextResponse.json(
        { error: "OpenRouter API error", code: "OPENROUTER_ERROR" },
        { status: response.status },
      );
    }

    const data = await response.json();

    // Check if we got valid choices back
    if (!data.choices || !data.choices[0]?.message?.content) {
      console.error("Invalid OpenRouter response:", data);
      // Don't fail - use default title
      return NextResponse.json({ title: "New Chat" });
    }

    const title = data.choices[0].message.content.trim() || "New Chat";

    // Update the chat with the generated title
    const { error: updateError } = await supabaseServer
      .from("chats")
      .update({ title })
      .eq("id", chat_id);

    if (updateError) {
      console.error("Error updating chat title:", updateError);
      return NextResponse.json(
        { error: "Failed to update title", code: "UPDATE_ERROR" },
        { status: 500 },
      );
    }

    return NextResponse.json({ title });
  } catch (err) {
    console.error("Title generation error:", err);
    return NextResponse.json(
      { error: "Title generation failed", code: "TITLE_ERROR" },
      { status: 500 },
    );
  }
}
