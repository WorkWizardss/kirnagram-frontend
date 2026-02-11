import { X } from "lucide-react";

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal = ({ isOpen, onClose }: PrivacyModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-lg border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-background rounded-t-xl">
          <h2 className="text-2xl font-bold text-foreground">Privacy Policy</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-6 text-sm text-muted-foreground space-y-4">
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2">1. Introduction</h3>
            <p>
              kirnagram respects your privacy. This policy informs you of how we collect, use, and disclose personal data.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2">2. Information Collection</h3>
            <p>We collect information you provide directly, such as:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Email address</li>
              <li>Full name</li>
              <li>Phone number</li>
              <li>Profile information</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2">3. Use of Data</h3>
            <p>We use collected data to:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Provide and maintain our service</li>
              <li>Notify you about changes</li>
              <li>Provide customer support</li>
              <li>Improve our service</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2">4. Data Security</h3>
            <p>
              We implement appropriate security measures to protect your personal data against unauthorized access, alteration, or destruction.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2">5. Third Party Services</h3>
            <p>
              We may use third-party services like Firebase for authentication and data storage. Please review their privacy policies.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2">6. User Rights</h3>
            <p>
              You have the right to access, update, or delete your personal data. Contact us for any privacy-related requests.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2">7. Changes to Policy</h3>
            <p>
              We may update this privacy policy from time to time. We will notify you of any changes by updating the policy on our site.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2">8. Contact Us</h3>
            <p>
              If you have any questions about this privacy policy, please contact us at support@kirnagram.com
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-6 bg-background sticky bottom-0 rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
