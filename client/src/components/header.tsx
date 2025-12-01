import { Link, useLocation } from "wouter";
import { Menu, CircleDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/lotto-result/today", label: "Today" },
  { href: "/lotto-result/yesterday", label: "Yesterday" },
  { href: "/game/powerball", label: "Powerball" },
  { href: "/game/lotto", label: "Lotto" },
  { href: "/game/daily-lotto", label: "Daily Lotto" },
  { href: "/game/jackpot", label: "Jackpots" },
  { href: "/news", label: "News" },
];

export function Header() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex h-16 lg:h-20 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2" data-testid="link-home">
            <div className="flex items-center gap-1">
              <CircleDot className="h-7 w-7 text-lottery-ball-main" />
              <CircleDot className="h-6 w-6 text-lottery-ball-bonus -ml-2" />
            </div>
            <span className="font-bold text-lg lg:text-xl hidden sm:block">
              SA Lotto Results
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={location === link.href ? "secondary" : "ghost"}
                  className="text-sm font-medium"
                  data-testid={`link-nav-${link.label.toLowerCase().replace(" ", "-")}`}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <nav className="flex flex-col gap-2 mt-8">
                  {navLinks.map((link) => (
                    <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                      <Button
                        variant={location === link.href ? "secondary" : "ghost"}
                        className="w-full justify-start text-base"
                        data-testid={`link-mobile-${link.label.toLowerCase().replace(" ", "-")}`}
                      >
                        {link.label}
                      </Button>
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
