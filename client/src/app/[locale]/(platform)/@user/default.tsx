import { redirect } from "next/navigation";

export default async function UserDefault({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/403`);
}
