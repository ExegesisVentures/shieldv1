import { IoShieldCheckmark } from "react-icons/io5";
import Link from "next/link";

export default function TermsPage() {
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
              Terms of Service
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

        {/* Content */}
        <div className="card-coreum rounded-2xl shadow-xl p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Agreement to Terms
            </h2>
            <p className="text-gray-300 leading-relaxed">
              By accessing or using ShieldNest, you agree to be bound by these Terms of Service 
              and all applicable laws and regulations. If you do not agree with any of these terms, 
              you are prohibited from using or accessing this platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Description of Service
            </h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              ShieldNest provides:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Coreum blockchain portfolio tracking and management</li>
              <li>Wallet connection and address monitoring</li>
              <li>Token and NFT balance visualization</li>
              <li>Liquidity pool position tracking</li>
              <li>Shield NFT membership and exclusive features (for Private Members)</li>
              <li>Community and membership benefits</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              User Types & Access Levels
            </h2>
            <div className="space-y-3">
              <div className="p-4 bg-[#101216] rounded-lg">
                <h3 className="font-semibold text-white mb-2">
                  Visitor (Guest)
                </h3>
                <p className="text-gray-300">
                  Limited read-only access. Data stored locally only. No account persistence.
                </p>
              </div>
              <div className="p-4 bg-[#101216] rounded-lg">
                <h3 className="font-semibold text-white mb-2">
                  Public User
                </h3>
                <p className="text-gray-300">
                  Registered users with email/password or wallet authentication. 
                  Access to portfolio tracking, wallet management, and public features.
                </p>
              </div>
              <div className="p-4 bg-[#101216] rounded-lg">
                <h3 className="font-semibold text-white mb-2">
                  Private Member (Shield NFT)
                </h3>
                <p className="text-gray-300">
                  Exclusive membership tier requiring Shield NFT ownership and signed PMA. 
                  Access to premium features, community, and member benefits.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Account Registration & Security
            </h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              When you create an account, you agree to:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your account information</li>
              <li>Keep your password and wallet keys secure</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized access</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Wallet Connection & Blockchain Interactions
            </h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              You acknowledge and agree that:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>You are solely responsible for your wallet security and private keys</li>
              <li>ShieldNest never has access to your private keys or funds</li>
              <li>Blockchain transactions are irreversible and permanent</li>
              <li>We display publicly available blockchain data but do not control it</li>
              <li>Network fees (gas) are determined by the Coreum blockchain, not ShieldNest</li>
              <li>You must verify all transaction details before signing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Shield NFT Membership
            </h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              Private membership requires:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Ownership of a valid Shield NFT in your connected wallet</li>
              <li>Signing of the Private Membership Agreement (PMA)</li>
              <li>Compliance with member community guidelines</li>
              <li>Membership benefits are non-transferable (tied to NFT ownership)</li>
              <li>We reserve the right to revoke membership for violations</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-3">
              Shield NFT value is set administratively and is a placeholder in v1. 
              Actual market value may differ.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Prohibited Activities
            </h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              You agree NOT to:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Use the platform for any illegal or unauthorized purpose</li>
              <li>Attempt to gain unauthorized access to systems or user accounts</li>
              <li>Interfere with or disrupt the platform or servers</li>
              <li>Transmit viruses, malware, or harmful code</li>
              <li>Scrape or harvest data without permission</li>
              <li>Impersonate others or misrepresent your affiliation</li>
              <li>Engage in market manipulation or fraudulent activities</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Intellectual Property
            </h2>
            <p className="text-gray-300 leading-relaxed">
              The ShieldNest platform, including all content, features, and functionality, 
              is owned by ShieldNest and is protected by copyright, trademark, and other 
              intellectual property laws. You may not copy, modify, distribute, or reverse 
              engineer any part of our platform without written permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Disclaimer of Warranties
            </h2>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-600">
              <p className="text-white font-semibold mb-2">
                IMPORTANT DISCLAIMER
              </p>
              <p className="text-gray-300 leading-relaxed">
                ShieldNest is provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; without warranties of any kind, 
                either express or implied. We do not guarantee that the platform will be uninterrupted, 
                secure, or error-free. We are not responsible for the accuracy of blockchain data, 
                third-party services, or wallet providers.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Limitation of Liability
            </h2>
            <p className="text-gray-300 leading-relaxed">
              To the maximum extent permitted by law, ShieldNest shall not be liable for any 
              indirect, incidental, special, consequential, or punitive damages, including but 
              not limited to loss of profits, data, or tokens, whether based on warranty, 
              contract, tort, or any other legal theory, arising out of or relating to your 
              use of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Not Financial Advice
            </h2>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-600">
              <p className="text-white font-semibold mb-2">
                CRYPTO INVESTMENT RISK
              </p>
              <p className="text-gray-300 leading-relaxed">
                ShieldNest does not provide financial, investment, tax, or legal advice. 
                Any information displayed is for informational purposes only. Cryptocurrency 
                investments carry significant risks. You should consult with professional 
                advisors before making any investment decisions.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Coming Soon Features
            </h2>
            <p className="text-gray-300 leading-relaxed">
              Features marked as &quot;Coming Soon&quot; (such as DEX trading and NFT sell-back) are 
              not yet available. We make no guarantees about when or if these features will 
              be implemented. Descriptions of future features are not binding commitments.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Termination
            </h2>
            <p className="text-gray-300 leading-relaxed">
              We reserve the right to suspend or terminate your account at any time for 
              violations of these Terms or for any other reason at our sole discretion. 
              You may also terminate your account at any time by contacting support or 
              using the account deletion feature in Settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Changes to Terms
            </h2>
            <p className="text-gray-300 leading-relaxed">
              We may modify these Terms at any time. We will notify users of material changes 
              by posting the updated Terms on this page and updating the &quot;Last updated&quot; date. 
              Your continued use of ShieldNest after changes constitutes acceptance of the 
              new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Governing Law
            </h2>
            <p className="text-gray-300 leading-relaxed">
              These Terms shall be governed by and construed in accordance with applicable 
              laws, without regard to conflict of law principles. Any disputes arising from 
              these Terms or your use of ShieldNest shall be resolved through binding arbitration.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Contact Us
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              If you have questions about these Terms of Service, please contact us:
            </p>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-white font-medium">
                Email: legal@shieldnest.io
              </p>
              <p className="text-gray-300 mt-1">
                Support: https://shieldnest.io/support
              </p>
            </div>
          </section>
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
            href="/pma"
            className="text-[#25d695] dark:text-[#25d695] hover:text-[#179b69] dark:hover:text-[#25d695]"
          >
            PMA Agreement
          </Link>
        </div>
      </div>
    </div>
  );
}

