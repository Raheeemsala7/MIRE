export default function PlatformLayout({
  admin,
  user,
}: {
  admin: React.ReactNode;
  user: React.ReactNode;
}) {
  return (
    <>
      {user}
      {admin}
    </>
  );
}
