import { signIn } from "@/lib/auth";

type SignInButtonProps = {
  label?: string;
};

export function SignInButton({ label = "Войти через GitHub" }: SignInButtonProps) {
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
        {label}
      </button>
    </form>
  );
}
