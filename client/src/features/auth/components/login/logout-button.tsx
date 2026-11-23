"use client";

import { logoutAction } from "../../actions/logout";
import { purgeClientSessionStorage } from "@/shared/lib/utils/client-auth.utils";

export function LogoutButton() {
  const handleSignOut = () => {
    purgeClientSessionStorage();
  };

  return (
    <form action={logoutAction} onSubmit={handleSignOut}>
      <button
        type="submit"
        className="rounded-full border border-ds-border-muted px-5 py-2 text-sm text-ds-text-primary transition-colors hover:bg-ds-primary-fade focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-primary cursor-pointer"
      >
        Sign out
      </button>
    </form>
  );
}
