import { Link } from "wouter";
import { CircleDot } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-card mt-auto">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                <CircleDot className="h-6 w-6 text-lottery-ball-main" />
                <CircleDot className="h-5 w-5 text-lottery-ball-bonus -ml-2" />
              </div>
              <span className="font-bold text-lg">SA Lotto Results</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-md">
              Your trusted source for South African lottery results. Check Powerball, Lotto, 
              Daily Lotto, and more. Results are published immediately after each draw.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/game/powerball" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-powerball">
                  Powerball Results
                </Link>
              </li>
              <li>
                <Link href="/game/lotto" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-lotto">
                  Lotto Results
                </Link>
              </li>
              <li>
                <Link href="/game/daily-lotto" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-daily-lotto">
                  Daily Lotto Results
                </Link>
              </li>
              <li>
                <Link href="/lotto-result/yesterday" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-yesterday">
                  Lotto Results Yesterday
                </Link>
              </li>
              <li>
                <Link href="/news" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-news">
                  Lottery News
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Information</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-about">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-contact">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-privacy">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>
            SA Lotto Results is not affiliated with the National Lottery. 
            Always verify results with official sources.
          </p>
          <p className="mt-2">
            National Lottery: 14A Charles Crescent, Eastgate Ext. 4, Sandton, 2148
          </p>
        </div>
      </div>
    </footer>
  );
}
