import { IoShieldCheckmark, IoDocument, IoCheckmarkCircle } from "react-icons/io5";
import Link from "next/link";

export default function PmaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#25d695] dark:text-[#25d695] hover:text-[#179b69] dark:hover:text-[#25d695] mb-6"
          >
            ← Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#25d695] to-[#25d695] rounded-lg flex items-center justify-center">
              <IoShieldCheckmark className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">
              Private Membership Agreement (PMA)
            </h1>
          </div>
          <p className="text-gray-400">
            Last updated: {new Date().toLocaleDateString("en-US", { 
              year: "numeric", 
              month: "long", 
              day: "numeric" 
            })}
          </p>
        </div>

        {/* Important Notice */}
        <div className="mb-8 p-6 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-2xl border-2 border-[#25d695] dark:border-[#179b69]">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-[#25d695] rounded-full flex items-center justify-center">
              <IoDocument className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Shield NFT Membership Agreement
              </h3>
              <p className="text-gray-300 leading-relaxed">
                This Private Membership Agreement (PMA) governs access to exclusive ShieldNest 
                features for Shield NFT holders. By signing this agreement, you unlock private 
                member benefits and agree to the terms outlined below.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="card-coreum rounded-2xl shadow-xl p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Agreement Overview
            </h2>
            <p className="text-gray-300 leading-relaxed">
              This Private Membership Agreement (&quot;PMA&quot; or &quot;Agreement&quot;) is entered into between 
              ShieldNest (&quot;Organization&quot;, &quot;we&quot;, &quot;us&quot;) and the individual or entity holding a 
              valid Shield NFT (&quot;Member&quot;, &quot;you&quot;). This agreement is supplemental to the 
              ShieldNest Terms of Service and Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Membership Requirements
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <IoCheckmarkCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                <p className="text-gray-300">
                  <span className="font-semibold">Shield NFT Ownership:</span> You must hold 
                  a valid Shield NFT in your connected Coreum wallet.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <IoCheckmarkCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                <p className="text-gray-300">
                  <span className="font-semibold">Digital Signature:</span> You must 
                  cryptographically sign this PMA using your wallet (ADR-36 standard).
                </p>
              </div>
              <div className="flex items-start gap-3">
                <IoCheckmarkCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                <p className="text-gray-300">
                  <span className="font-semibold">Active Account:</span> You must maintain 
                  a Public User account with verified email and wallet connection.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <IoCheckmarkCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                <p className="text-gray-300">
                  <span className="font-semibold">Compliance:</span> You must comply with 
                  all community guidelines and member conduct policies.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Private Member Benefits
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              As a Private Member with an active Shield NFT, you gain access to:
            </p>
            <div className="space-y-3">
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <h3 className="font-semibold text-white mb-1">
                  Exclusive Features
                </h3>
                <p className="text-sm text-gray-300">
                  Advanced analytics, priority support, early access to new features, 
                  and enhanced portfolio tools.
                </p>
              </div>
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <h3 className="font-semibold text-white mb-1">
                  Community Access
                </h3>
                <p className="text-sm text-gray-300">
                  Private member forums, exclusive events, direct communication channels, 
                  and governance participation.
                </p>
              </div>
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <h3 className="font-semibold text-white mb-1">
                  Premium Integrations
                </h3>
                <p className="text-sm text-gray-300">
                  API access, custom alerts, webhooks, data exports, and third-party 
                  integrations (when available).
                </p>
              </div>
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <h3 className="font-semibold text-white mb-1">
                  Revenue Sharing (Future)
                </h3>
                <p className="text-sm text-gray-300">
                  Potential eligibility for platform revenue distribution and rewards 
                  programs (subject to future implementation).
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Membership Duration & Transfer
            </h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>
                Membership is active as long as you hold the Shield NFT in your wallet
              </li>
              <li>
                If you transfer or sell your Shield NFT, membership benefits are 
                automatically transferred to the new holder (upon their PMA signature)
              </li>
              <li>
                If you lose access to your wallet, you may be required to re-verify 
                ownership through our recovery process
              </li>
              <li>
                Membership can be suspended or revoked for violations of this Agreement
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Shield NFT Valuation
            </h2>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-600">
              <p className="text-white font-semibold mb-2">
                Important Notice
              </p>
              <p className="text-gray-300 leading-relaxed">
                The Shield NFT value displayed in ShieldNest ($5,000 - $6,000 range) 
                is an administratively set placeholder for v1. This does NOT represent 
                market value, guaranteed value, or financial advice. Actual NFT value 
                is determined by market conditions and buyer/seller negotiations.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Member Conduct & Community Guidelines
            </h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              As a Private Member, you agree to:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Treat all members and staff with respect and professionalism</li>
              <li>Refrain from harassment, discrimination, or abusive behavior</li>
              <li>Not share private member content or discussions publicly</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Not use member benefits for illegal or unethical purposes</li>
              <li>Report violations of community guidelines to moderators</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Privacy & Data Protection
            </h2>
            <p className="text-gray-300 leading-relaxed">
              As a Private Member, your data is subject to enhanced privacy protections. 
              We collect and store your PMA signature hash on-chain for verification 
              purposes. Private member communications and activities are not shared 
              publicly. For more details, see our{" "}
              <Link 
                href="/privacy" 
                className="text-[#25d695] dark:text-[#25d695] hover:underline"
              >
                Privacy Policy
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Disclaimers & Limitations
            </h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>
                Member benefits may change at any time at our discretion with reasonable notice
              </li>
              <li>
                We do not guarantee specific financial returns or value appreciation
              </li>
              <li>
                Membership does not constitute ownership or equity in ShieldNest
              </li>
              <li>
                Future features marked as &quot;coming soon&quot; are not guaranteed to be implemented
              </li>
              <li>
                Platform availability and uptime are not guaranteed
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Termination & Suspension
            </h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              We reserve the right to suspend or terminate Private Membership for:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Violations of this Agreement or Terms of Service</li>
              <li>Abusive or harmful behavior toward community members</li>
              <li>Fraudulent activity or misrepresentation</li>
              <li>Illegal conduct or regulatory compliance issues</li>
              <li>Non-payment of required fees (if applicable in future)</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-3">
              Termination does not affect your ownership of the Shield NFT itself, 
              but access to member-only features will be revoked.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Dispute Resolution
            </h2>
            <p className="text-gray-300 leading-relaxed">
              Any disputes arising from this PMA shall be resolved through binding arbitration 
              in accordance with the arbitration provisions in our Terms of Service. You waive 
              your right to participate in class action lawsuits against ShieldNest.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Amendments
            </h2>
            <p className="text-gray-300 leading-relaxed">
              We may update this PMA from time to time. Material changes will be communicated 
              to Private Members via email and in-platform notifications at least 30 days 
              before taking effect. Continued use of member features after changes constitutes 
              acceptance of the updated PMA.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Digital Signature & Agreement
            </h2>
            <div className="p-6 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl border-2 border-[#25d695] dark:border-[#179b69]">
              <p className="text-white font-semibold mb-3">
                By digitally signing this PMA using your wallet:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>You confirm you have read and understood this entire Agreement</li>
                <li>You agree to be bound by all terms and conditions</li>
                <li>You acknowledge ownership of your Shield NFT</li>
                <li>You consent to the collection and storage of your signature hash</li>
              </ul>
              <p className="text-sm text-gray-400">
                Your signature will be cryptographically verified and stored on-chain for 
                authentication purposes. This signature cannot be forged or transferred.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Contact & Support
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              For questions about this PMA or Private Membership:
            </p>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-white font-medium">
                Private Member Support: members@shieldnest.io
              </p>
              <p className="text-gray-300 mt-1">
                General Legal: legal@shieldnest.io
              </p>
              <p className="text-gray-300 mt-1">
                Community: https://shieldnest.io/community
              </p>
            </div>
          </section>
        </div>

        {/* Sign CTA */}
        <div className="mt-8 p-6 bg-gradient-to-r from-[#25d695] to-[#25d695] rounded-2xl text-white text-center">
          <h3 className="text-2xl font-bold mb-2">Ready to Become a Private Member?</h3>
          <p className="mb-4 text-purple-100">
            Sign the PMA and unlock exclusive features with your Shield NFT
          </p>
          <Link
            href="/membership"
            className="inline-block px-6 py-3 bg-white text-[#25d695] font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Go to Membership
          </Link>
        </div>

        {/* Footer Links */}
        <div className="mt-8 flex justify-center gap-6 text-sm">
          <Link
            href="/privacy"
            className="text-[#25d695] dark:text-[#25d695] hover:text-[#179b69] dark:hover:text-[#25d695]"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="text-[#25d695] dark:text-[#25d695] hover:text-[#179b69] dark:hover:text-[#25d695]"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}

