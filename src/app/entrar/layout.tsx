export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
   <main className="h-full w-full">
    {children}
   </main>
  );
}