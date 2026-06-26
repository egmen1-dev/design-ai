import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

type AdminSession = {
  user: {
    id: string;
    email: string;
    name?: string | null;
  };
};

export async function requireAdmin():
  Promise<{ session: AdminSession } | { error: NextResponse }> {
  const session = await auth();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return { error: NextResponse.json({ error: "Доступ запрещён" }, { status: 403 }) };
  }

  return {
    session: {
      user: {
        id: session.user.id as string,
        email: session.user.email,
        name: session.user.name,
      },
    },
  };
}

export function validationError(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
