import { MainLayout } from "@/components/layout/MainLayout";

const Terms = () => (
  <MainLayout showRightSidebar={false}>
    <div className="max-w-3xl mx-auto px-2 md:px-0 overflow-x-hidden">
      <h1 className="text-xl font-display font-bold mb-4">Terms of Service</h1>
      <div className="prose prose-sm dark:prose-invert max-w-none space-y-4">
        <p className="text-muted-foreground">Last updated: January 2025</p>

        <div className="p-4 bg-card border border-border rounded-xl">
          <h2 className="text-lg font-semibold mb-2">1. Acceptance of Terms</h2>
          <p className="text-sm text-muted-foreground">
            By accessing kirnagram, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this platform.
          </p>
        </div>

        <div className="p-4 bg-card border border-border rounded-xl">
          <h2 className="text-lg font-semibold mb-2">2. User Accounts</h2>
          <p className="text-sm text-muted-foreground">
            You are responsible for maintaining the confidentiality of your account credentials and all activities under your account. You must be at least 18 years old to create an account. You agree to provide accurate, current, and complete information during registration.
          </p>
        </div>

        <div className="p-4 bg-card border border-border rounded-xl">
          <h2 className="text-lg font-semibold mb-2">3. Content Guidelines</h2>
          <p className="text-sm text-muted-foreground">
            Users must not upload content that is illegal, harmful, threatening, abusive, or violates intellectual property rights. AI-generated content must be clearly labeled as such. We reserve the right to remove any content that violates these guidelines.
          </p>
        </div>

        <div className="p-4 bg-card border border-border rounded-xl">
          <h2 className="text-lg font-semibold mb-2">4. AI Creator Program</h2>
          <p className="text-sm text-muted-foreground">
            AI Creators must provide accurate verification documents (Aadhaar, PAN) for identity verification. Earnings are subject to platform fees (15%) and payment processing times (7-10 business days). Creators retain rights to their original AI prompts and styles.
          </p>
        </div>

        <div className="p-4 bg-card border border-border rounded-xl">
          <h2 className="text-lg font-semibold mb-2">5. Remix Feature</h2>
          <p className="text-sm text-muted-foreground">
            By using the Remix feature, users agree that their AI-generated styles may be applied to other users' images. Original creators receive compensation for each remix of their style. Users who remix styles agree to respect the original creator's intellectual property.
          </p>
        </div>

        <div className="p-4 bg-card border border-border rounded-xl">
          <h2 className="text-lg font-semibold mb-2">6. Intellectual Property</h2>
          <p className="text-sm text-muted-foreground">
            You retain ownership of content you create. By posting, you grant kirnagram a non-exclusive, worldwide license to display, distribute, and promote your content on the platform. You may not use our trademarks without prior written consent.
          </p>
        </div>

        <div className="p-4 bg-card border border-border rounded-xl">
          <h2 className="text-lg font-semibold mb-2">7. Payments & Refunds</h2>
          <p className="text-sm text-muted-foreground">
            All payments are processed through secure third-party providers. Creator earnings are calculated based on remix usage and engagement metrics. Refunds for premium features are available within 7 days of purchase.
          </p>
        </div>

        <div className="p-4 bg-card border border-border rounded-xl">
          <h2 className="text-lg font-semibold mb-2">8. Termination</h2>
          <p className="text-sm text-muted-foreground">
            We reserve the right to suspend or terminate accounts that violate these terms without prior notice. Users may delete their accounts at any time through account settings. Upon termination, your content may be retained for legal or operational purposes.
          </p>
        </div>

        <div className="p-4 bg-card border border-border rounded-xl">
          <h2 className="text-lg font-semibold mb-2">9. Contact</h2>
          <p className="text-sm text-muted-foreground">
            Questions about these terms? Contact us at legal@kirnagram.com
          </p>
        </div>
      </div>
    </div>
  </MainLayout>
);

export default Terms;