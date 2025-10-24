import { forgotPasswordAction } from "@/app/actions";
import AuthSubmitButton from "@/components/auth-submit-button";
import { FormMessage, Message } from "@/components/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import ShieldNestLogo from "@/components/shieldnest-logo";
import { IoShieldCheckmark, IoArrowBack, IoMailOpen } from "react-icons/io5";

export default async function ForgotPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 neo-gradient-bg">
      <div className="w-full max-w-md">
        {/* Logo and Badge */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <ShieldNestLogo width={48} height={48} showText={false} />
          </div>
          <div className="inline-flex items-center gap-2 glass-coreum px-4 py-2 rounded-full mb-4">
            <IoShieldCheckmark className="w-4 h-4 text-[#25d695]" />
            <span className="text-xs font-semibold text-gray-300 dark:text-gray-300">
              Password Recovery
            </span>
          </div>
        </div>

        {/* Main Card */}
        <div className="neo-card p-8">
          <div className="mb-8">
            <div className="neo-icon-glow-blue mb-6 inline-flex">
              <IoMailOpen className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Reset Password
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          <form action={forgotPasswordAction} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-foreground font-medium mb-2 block">
                Email Address
              </Label>
              <Input 
                name="email" 
                placeholder="you@example.com" 
                required 
                className="input-coreum h-11"
                autoComplete="email"
                type="email"
              />
            </div>

            <AuthSubmitButton label="Send Reset Link" pendingLabel="Sending..." />
            <FormMessage message={searchParams} />
          </form>

          <div className="mt-6 text-center">
            <Link 
              href="/sign-in" 
              className="text-sm text-[#25d695] hover:underline inline-flex items-center gap-1 transition-all hover:gap-2"
            >
              <IoArrowBack className="w-3 h-3" />
              Back to sign in
            </Link>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Need help? Contact{" "}
          <a href="mailto:support@shieldnest.io" className="text-[#25d695] hover:underline">
            support@shieldnest.io
          </a>
        </p>
      </div>
    </div>
  );
}

