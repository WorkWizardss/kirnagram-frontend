import { MainLayout } from "@/components/layout/MainLayout";

const Privacy = () => (
  <MainLayout showRightSidebar={true}>
    <div className="max-w-3xl mx-auto px-2 md:px-0 overflow-x-hidden">
      <h1 className="text-xl font-display font-bold mb-4">Privacy Policy</h1>
      <div className="prose prose-sm dark:prose-invert max-w-none space-y-4">
        <p className="text-muted-foreground">Last updated: January 2025</p>
        
        <div className="p-4 bg-card border border-border rounded-xl">
          <h2 className="text-lg font-semibold mb-2">1. Information We Collect</h2>
          <p className="text-sm text-muted-foreground">
            We collect information you provide directly, including name, email, phone number, and profile information when you create an account. For AI Creators, we also collect identity verification documents (Aadhaar, PAN) and bank details for payment processing.
          </p>
        </div>

        <div className="p-4 bg-card border border-border rounded-xl">
          <h2 className="text-lg font-semibold mb-2">2. How We Use Your Information</h2>
          <p className="text-sm text-muted-foreground">
            We use your information to provide and improve our services, process transactions, send notifications, verify creator identities, process payments, and ensure platform security.
          </p>
        </div>

        <div className="p-4 bg-card border border-border rounded-xl">
          <h2 className="text-lg font-semibold mb-2">3. Information Sharing</h2>
          <p className="text-sm text-muted-foreground">
            We do not sell your personal information. We may share data with service providers who assist in operating our platform, payment processors, and identity verification services.
          </p>
        </div>

        <div className="p-4 bg-card border border-border rounded-xl">
          <h2 className="text-lg font-semibold mb-2">4. Data Security</h2>
          <p className="text-sm text-muted-foreground">
            We implement industry-standard security measures including encryption, secure storage, and access controls to protect your data from unauthorized access.
          </p>
        </div>

        <div className="p-4 bg-card border border-border rounded-xl">
          <h2 className="text-lg font-semibold mb-2">5. Your Rights</h2>
          <p className="text-sm text-muted-foreground">
            You have the right to access, update, or delete your personal information at any time through your account settings. You can also request a copy of your data or opt out of marketing communications.
          </p>
        </div>

        <div className="p-4 bg-card border border-border rounded-xl">
          <h2 className="text-lg font-semibold mb-2">6. Cookies & Tracking</h2>
          <p className="text-sm text-muted-foreground">
            We use cookies and similar technologies to enhance your experience, analyze usage patterns, and personalize content. You can manage cookie preferences in your browser settings.
          </p>
        </div>

        <div className="p-4 bg-card border border-border rounded-xl">
          <h2 className="text-lg font-semibold mb-2">7. Contact Us</h2>
          <p className="text-sm text-muted-foreground">
            For questions about this policy or to exercise your data rights, contact us at privacy@kirnagram.com
          </p>
        </div>
      </div>
    </div>
  </MainLayout>
);

export default Privacy;