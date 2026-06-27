import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { applyUserFeedback } from "@/lib/feedback";

const bodySchema = z.object({
  feedback: z.enum(["like", "dislike"]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid feedback" }, { status: 400 });
  }

  try {
    const result = await applyUserFeedback(id, session.user.id, body.feedback);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("[feedback]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
