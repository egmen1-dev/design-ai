import Link from "next/link";
import { PricingCard } from "@/components/PricingCard";

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-12 text-center">
        <Link href="/" className="text-sm text-brand-500 hover:underline">
          ← Back
        </Link>
        <h1 className="mt-4 text-4xl font-bold">Pricing</h1>
        <p className="mt-2 text-slate-400">
          Free tier for trying out, Pro for power users
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        <PricingCard
          name="Free"
          price="$0"
          features={["3 generations / day", "Watermarked exports", "GitHub sign-in"]}
          cta="Current plan"
          disabled
        />
        <PricingCard
          name="Pro"
          price="$9/mo"
          features={[
            "30 generations / day",
            "Watermarked exports",
            "Priority rendering",
          ]}
          cta="Subscribe with Stripe"
          checkout
          highlighted
        />
      </div>
    </main>
  );
}
