import type { ReactNode } from "react";

export default function RegisterLoading(): ReactNode {
  return (
    <div aria-hidden="true" className="min-h-svh bg-ds-plain">
      <div className="flex h-20 items-center justify-center border-b border-ds-border-subtle">
        <span className="font-brand-serif text-3xl font-medium tracking-wider">MIRÉ</span>
      </div>
      <div className="mx-auto grid max-w-7xl gap-16 px-6 py-12 lg:grid-cols-2 lg:px-12">
        <div className="hidden aspect-4/5 rounded-2xl bg-ds-subtle lg:block" />
        <div className="mx-auto w-full max-w-md space-y-6 self-center">
          <div className="h-12 w-3/4 rounded-lg bg-ds-muted" />
          <div className="mb-10 h-6 w-full rounded bg-ds-subtle" />
          {["name", "email", "phone", "password"].map((field) => (
            <div key={field} className="space-y-3">
              <div className="h-4 w-24 rounded bg-ds-muted" />
              <div className="h-12 rounded-lg bg-ds-subtle" />
            </div>
          ))}
          <div className="h-12 rounded-full bg-ds-primary-faint" />
        </div>
      </div>
    </div>
  );
}
