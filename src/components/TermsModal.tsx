import { X } from "lucide-react";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal = ({ isOpen, onClose }: TermsModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-lg border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-background rounded-t-xl">
          <h2 className="text-2xl font-bold text-foreground">Terms of Service</h2>
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
            <h3 className="text-lg font-semibold text-foreground mb-2">1. Acceptance of Terms</h3>
            <p>
              By accessing and using kirnagram, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2">2. Use License</h3>
            <p>Permission is granted to temporarily download one copy of the materials on kirnagram for personal, non-commercial viewing only.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2">3. Disclaimer</h3>
            <p>
              The materials on kirnagram are provided on an 'as is' basis. kirnagram makes no warranties, expressed or implied.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2">4. Limitations</h3>
            <p>
              In no event shall kirnagram or its suppliers be liable for any damages arising out of the use or inability to use the materials.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2">5. Accuracy of Materials</h3>
            <p>
              The materials appearing on kirnagram could include technical, typographical, or photographic errors.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2">6. Links</h3>
            <p>
              kirnagram is not responsible for the contents of any linked sites. Use of any such linked website is at the user's own risk.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2">7. Modifications</h3>
            <p>
              kirnagram may revise these terms of service at any time without notice.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2">8. Governing Law</h3>
            <p>
              These terms are governed by and construed in accordance with applicable laws.
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
