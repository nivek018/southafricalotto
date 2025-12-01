import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Mail } from "lucide-react";

export default function ContactPage() {
  useEffect(() => {
    document.title = "Contact Us - SA Lotto Results | Get in Touch";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Contact SA Lotto Results for questions about South African lottery results. Get in touch for support regarding Powerball, Lotto, and Daily Lotto results.");
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

        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Contact Us</h1>
          <p className="text-muted-foreground">
            Have questions? We’d love to hear from you. Reach out via the contact details below.
          </p>
        </div>

        <div className="space-y-6 bg-card rounded-lg p-6 border">
          <div className="flex gap-3 items-start">
            <Mail className="h-6 w-6 text-lottery-ball-main mt-1" />
            <div>
              <h3 className="font-semibold">Email</h3>
              <p className="text-muted-foreground">kevs022@gmail.com</p>
            </div>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            For questions about SA lottery results, website feedback, corrections, or partnership inquiries,
            please reach out via email. We typically respond within one business day on weekdays and aim to keep
            replies concise and actionable.
          </p>
        </div>
      </div>
    </div>
  );
}
