import { AppHeader } from "@/components/shared/AppHeader";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AppHeader />
      <main>{children}</main>
    </>
  );
}
