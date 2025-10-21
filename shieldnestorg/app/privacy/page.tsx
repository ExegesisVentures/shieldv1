import { IoShieldCheckmark } from "react-icons/io5";
import Link from "next/link";

export default function PrivacyPage() {
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
              Privacy Policy
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
              Introduction
            </h2>
            <p className="text-gray-300 leading-relaxed">
              ShieldNest (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your 
              information when you use our Coreum portfolio management and membership platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Information We Collect
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-white mb-2">
                  Account Information
                </h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Email address (for Public and Private users)</li>
                  <li>Wallet addresses (Coreum blockchain addresses)</li>
                  <li>Profile information (username, preferences)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">
                  Blockchain Data
                </h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Public blockchain transaction data</li>
                  <li>Token holdings and balances</li>
                  <li>NFT ownership information</li>
                  <li>Liquidity pool positions</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">
                  Usage Data
                </h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Browser type and version</li>
                  <li>Pages visited and features used</li>
                  <li>Time and date of visits</li>
                  <li>IP address (anonymized)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              How We Use Your Information
            </h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Provide and maintain our portfolio management services</li>
              <li>Authenticate your identity and wallet ownership</li>
              <li>Process Shield NFT membership verification</li>
              <li>Send important updates about your account or services</li>
              <li>Improve and optimize our platform</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              User Types & Data Storage
            </h2>
            <div className="space-y-3">
              <div className="p-4 bg-[#101216] rounded-lg">
                <h3 className="font-semibold text-white mb-2">
                  Visitor
                </h3>
                <p className="text-gray-300">
                  Session-only storage. No data is saved permanently. Wallet addresses 
                  are stored locally in your browser only.
                </p>
              </div>
              <div className="p-4 bg-[#101216] rounded-lg">
                <h3 className="font-semibold text-white mb-2">
                  Public User
                </h3>
                <p className="text-gray-300">
                  Email and wallet addresses are stored securely in our database. 
                  You can delete your account at any time from Settings.
                </p>
              </div>
              <div className="p-4 bg-[#101216] rounded-lg">
                <h3 className="font-semibold text-white mb-2">
                  Private Member (Shield NFT)
                </h3>
                <p className="text-gray-300">
                  Additional PMA (Private Membership Agreement) signing data and 
                  NFT verification records. Enhanced privacy protections apply.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Data Sharing & Disclosure
            </h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              We do not sell your personal information. We may share your information only in 
              these circumstances:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>With your explicit consent</li>
              <li>To comply with legal obligations or valid legal requests</li>
              <li>To protect our rights, privacy, safety, or property</li>
              <li>With service providers who assist in operating our platform (under strict confidentiality)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Blockchain & Public Data
            </h2>
            <p className="text-gray-300 leading-relaxed">
              Please note that blockchain transactions are public and immutable. Any transaction 
              you make on the Coreum blockchain is permanently visible to anyone. ShieldNest 
              displays this publicly available blockchain data but does not control or modify it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Your Rights
            </h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Withdraw consent (where applicable)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Security
            </h2>
            <p className="text-gray-300 leading-relaxed">
              We implement industry-standard security measures including encryption, secure 
              authentication, row-level security (RLS), and regular security audits. However, 
              no method of transmission over the internet is 100% secure. We recommend using 
              strong passwords and enabling two-factor authentication where available.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Children&apos;s Privacy
            </h2>
            <p className="text-gray-300 leading-relaxed">
              ShieldNest is not intended for users under the age of 18. We do not knowingly 
              collect personal information from children. If you believe we have collected 
              information from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Changes to This Policy
            </h2>
            <p className="text-gray-300 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any 
              material changes by posting the new policy on this page and updating the &quot;Last 
              updated&quot; date. We encourage you to review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Contact Us
            </h2>
            <p className="text-gray-300 leading-relaxed">
              If you have questions about this Privacy Policy or wish to exercise your rights, 
              please contact us:
            </p>
            <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-white font-medium">
                Email: privacy@shieldnest.io
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
            href="/terms"
            className="text-[#25d695] dark:text-[#25d695] hover:text-[#179b69] dark:hover:text-[#25d695]"
          >
            Terms of Service
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

