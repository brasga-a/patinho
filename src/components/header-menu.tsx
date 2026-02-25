"use client";

import { authClient } from "@/lib/authClient";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { LogOut, Menu, Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

export function HeaderMenu() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/entrar");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <Menu className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 space-y-3">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Tema</Label>
          <div className="flex gap-1">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              size="icon"
              className="flex-1 h-8"
              onClick={() => setTheme("light")}
            >
              <Sun className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              size="icon"
              className="flex-1 h-8"
              onClick={() => setTheme("dark")}
            >
              <Moon className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={theme === "system" ? "default" : "outline"}
              size="icon"
              className="flex-1 h-8"
              onClick={() => setTheme("system")}
            >
              <Monitor className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="border-t pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="h-3.5 w-3.5 mr-2" />
            Sair
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
