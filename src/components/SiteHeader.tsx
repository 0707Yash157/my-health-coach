import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";

export function SiteHeader() {
  const { user } = useAuth();
  const nav = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    nav("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button variant="hero" asChild>
                <Link to="/auth?mode=signup">Get started</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
