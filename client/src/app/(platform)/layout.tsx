import "../globals.css";
import { PlatformSlots } from "./platform-slots";
import { platformGeist, platformPlayfair } from "@/shared/lib/platform-fonts";

export default function PlatformLayout({ admin, store, children }: { admin: React.ReactNode; store: React.ReactNode; children: React.ReactNode }) {
  return <html lang="en" className={`${platformGeist.variable} ${platformPlayfair.variable} h-full antialiased`}><body className="min-h-full bg-ds-plain font-sans text-ds-text-plain"><PlatformSlots admin={admin} store={store}>{children}</PlatformSlots></body></html>;
}
