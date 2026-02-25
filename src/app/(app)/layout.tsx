import { FloatingTimerIsland } from "@/components/tasks/floating-timer-island";
import { TimerProvider } from "@/providers/timer-provider";

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
   <main className="min-h-screen">
    <TimerProvider>
      {children}
      <FloatingTimerIsland />
    </TimerProvider>
   </main>
  );
}