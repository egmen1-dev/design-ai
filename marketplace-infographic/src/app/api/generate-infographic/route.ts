import { NextRequest } from "next/server";
import { handleGenerateInfographic } from "@/lib/generate-infographic-handler";

export async function POST(request: NextRequest) {
  return handleGenerateInfographic(request);
}
