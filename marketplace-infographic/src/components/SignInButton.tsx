import { signIn } from "@/lib/auth";

export function SignInButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("github");
      }}
    >
      <button
        type="submit"
        className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200"
      >
        Войти через GitHub
      </button>
    </form>
  );
}
