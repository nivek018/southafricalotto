import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useEffect } from "react";

export default function PrivacyPolicyPage() {
  useEffect(() => {
    document.title = "Privacy Policy - African Lottery Results | Data Protection";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Read African Lottery's privacy policy. Learn how we collect, use, and protect your personal information when you use our South African lottery results website.");
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
          <h1>Privacy Policy</h1>

          <p>
            <strong>Last updated:</strong> November 2025
          </p>

          <h2>Introduction</h2>
          <p>
            African Lottery ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.
          </p>

          <h2>Information We Collect</h2>
          <p>We may collect information about you in a variety of ways. The information we may collect on the Site includes:</p>

          <h3>Personal Data</h3>
          <ul>
            <li>Name</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Messages and inquiries</li>
          </ul>

          <h3>Automatic Data</h3>
          <ul>
            <li>Browser information</li>
            <li>Device information</li>
            <li>IP address</li>
            <li>Page views and interactions</li>
          </ul>

          <h2>How We Use Your Information</h2>
          <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:</p>

          <ul>
            <li>Email you regarding your inquiry</li>
            <li>Fulfill and manage your requests</li>
            <li>Generate analytics data</li>
            <li>Increase the functionality of the Site</li>
            <li>Monitor and analyze trends, usage, and activities</li>
            <li>Notify you of updates to the Site</li>
            <li>Offer new products, services, and/or recommendations</li>
          </ul>

          <h2>Disclosure of Your Information</h2>
          <p>
            We may share information we have collected about you in certain situations:
          </p>

          <ul>
            <li>
              <strong>By Law or to Protect Rights:</strong> If we believe the release of information is necessary to comply with the law.
            </li>
            <li>
              <strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us.
            </li>
            <li>
              <strong>Business Transfer:</strong> If African Lottery is involved in a merger or acquisition, your information may be transferred as part of that transaction.
            </li>
          </ul>

          <h2>Security of Your Information</h2>
          <p>
            We use administrative, technical, and physical security measures to protect your personal information. However, no method of transmission over the Internet or method of electronic storage is 100% secure.
          </p>

          <h2>Contact Us</h2>
          <p>
            If you have questions or comments about this Privacy Policy, please contact us at:
          </p>

          <p>
            <strong>Email:</strong> privacy@africanlottery.co.za<br />
            <strong>Address:</strong> Johannesburg, South Africa
          </p>

          <h2>Changes to This Privacy Policy</h2>
          <p>
            We reserve the right to modify this privacy policy at any time. Your continued use of the Site following the posting of a revised Privacy Policy means that you accept and agree to the changes.
          </p>
        </article>
      </div>
    </div>
  );
}
