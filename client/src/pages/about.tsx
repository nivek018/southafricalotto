import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Heart, Target, Zap } from "lucide-react";
import { useEffect } from "react";

export default function AboutPage() {
  useEffect(() => {
    document.title = "About Us - African Lottery Results | South African National Lottery";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Learn about African Lottery - your trusted source for South African lottery results including Powerball, Lotto, and Daily Lotto. Real-time results and complete draw history.");
    }
  }, []);
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-6">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <article className="prose dark:prose-invert max-w-none">
          <h1>About African Lottery</h1>
          
          <p className="lead">
            African Lottery is your trusted source for South African lottery results and news. We provide real-time updates on Powerball, Lotto, Daily Lotto, and all major lottery games.
          </p>

          <h2>Our Mission</h2>
          <p>
            To provide accurate, timely, and reliable lottery results to South African players, helping them stay informed about their favorite games and potential winnings.
          </p>

          <h2>What We Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
            <div className="bg-card p-6 rounded-lg">
              <Zap className="h-8 w-8 text-lottery-ball-main mb-4" />
              <h3>Real-Time Results</h3>
              <p className="text-sm text-muted-foreground">
                Get lottery results immediately after each draw
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg">
              <Target className="h-8 w-8 text-lottery-ball-bonus mb-4" />
              <h3>Complete History</h3>
              <p className="text-sm text-muted-foreground">
                Access draw history and statistics for all games
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg">
              <Heart className="h-8 w-8 text-red-500 mb-4" />
              <h3>Lottery News</h3>
              <p className="text-sm text-muted-foreground">
                Stay updated with lottery news and promotions
              </p>
            </div>
          </div>

          <h2>Supported Games</h2>
          <ul>
            <li>Powerball</li>
            <li>Powerball Plus</li>
            <li>Lotto</li>
            <li>Lotto Plus 1</li>
            <li>Lotto Plus 2</li>
            <li>Daily Lotto</li>
            <li>Daily Lotto Plus</li>
          </ul>

          <h2>How to Use</h2>
          <ol>
            <li>Browse the latest results on the homepage</li>
            <li>Click on any game to view its complete draw history</li>
            <li>Check yesterday's results for a date-specific view</li>
            <li>Read the latest lottery news in our news section</li>
          </ol>

          <h2>Data Accuracy</h2>
          <p>
            Our results are sourced directly from official lottery databases and verified for accuracy. We update our system immediately after each draw to ensure you have the most current information.
          </p>

          <h2>Contact Us</h2>
          <p>
            Have questions or feedback? <Link href="/contact"><span className="text-lottery-ball-main hover:underline cursor-pointer">Contact us</span></Link> and we'll be happy to help.
          </p>
        </article>
      </div>
    </div>
  );
}
