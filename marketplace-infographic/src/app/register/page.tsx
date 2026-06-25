import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/RegisterForm";
import { SignInButton } from "@/components/SignInButton";
import { auth } from "@/lib/auth";

const benefits = [
  "3 бесплатные генерации инфографики в день",
  "История созданных изображений в личном кабинете",
  "Готовность к Pro-тарифу после подключения Stripe",
];

export default async function RegisterPage() {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-16">
      <Link href="/" className="text-sm text-brand-500 hover:underline">
        ← На главную
      </Link>

      <section className="mt-12 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-brand-500">
            Регистрация
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            Начните создавать инфографику для маркетплейсов
          </h1>
          <p className="mt-5 text-lg text-slate-400">
            Зарегистрируйтесь через GitHub, чтобы сохранять генерации,
            отслеживать лимиты и готовить карточки товаров, витрины и отчёты в
            одном кабинете.
          </p>

          <ul className="mt-8 space-y-3 text-slate-300">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-brand-500" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl shadow-slate-950/40">
          <h2 className="text-2xl font-semibold">Создать аккаунт</h2>
          <p className="mt-3 text-sm text-slate-400">
            Зарегистрируйтесь по email и паролю или используйте GitHub OAuth.
            Пароли хранятся только в виде bcrypt-хеша.
          </p>

          <RegisterForm />

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-xs uppercase tracking-widest text-slate-500">
              или
            </span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          <div>
            <SignInButton label="Зарегистрироваться через GitHub" />
          </div>

          <p className="mt-6 text-xs leading-5 text-slate-500">
            После регистрации вы попадёте в кабинет, где сохраняется история
            сгенерированных изображений.
          </p>
        </div>
      </section>
    </main>
  );
}
