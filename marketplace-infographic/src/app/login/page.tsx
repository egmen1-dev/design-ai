import { Suspense } from "react";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center">Загрузка...</div>}>
      <LoginForm />
    </Suspense>
  );
}
