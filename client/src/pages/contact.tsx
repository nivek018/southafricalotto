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
            If you have any questions regarding the SA Lottery results, feedback or suggestions about our website, 
            need to report any corrections, or are interested in exploring partnership opportunities, 
            we encourage you to reach out to us via email. Our team is committed to providing timely and helpful responses, 
            typically within one business day during weekdays. We strive to keep our replies clear, concise, and actionable, 
            ensuring that we address your inquiry efficiently and effectively. We value your input and are dedicated to 
            providing the best possible experience for all of our users. Thank you for reaching out, and we look forward to assisting you!
          </p>
        </div>
      </div>
    </div>
  );
}
