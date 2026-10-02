import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const filePath = path.resolve(process.cwd(), "AI_AGENT_INTEGRATION.md");
    if (!fs.existsSync(filePath)) {
      return new NextResponse("# StackYup AI Agent Spec\n\nFile not found.", {
        status: 404,
        headers: { "Content-Type": "text/markdown; charset=utf-8" },
      });
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const { searchParams } = new URL(request.url);
    const isDownload = searchParams.get("download") === "1" || searchParams.get("download") === "true";

    const headers: Record<string, string> = {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=300",
    };

    if (isDownload) {
      headers["Content-Disposition"] = 'attachment; filename="AI_AGENT_INTEGRATION.md"';
    }

    return new NextResponse(content, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    return new NextResponse(`Error reading spec: ${error.message}`, {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
