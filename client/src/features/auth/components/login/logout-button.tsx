import { logoutAction } from "../../actions/logout";

export function LogoutButton() {
  return <form action={logoutAction}><button type="submit" className="rounded-full border border-ds-border-muted px-5 py-2 text-sm text-ds-text-primary transition-colors hover:bg-ds-primary-fade focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-primary">Sign out</button></form>;
}
