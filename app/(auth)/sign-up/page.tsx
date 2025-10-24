import { signUpAction } from "@/app/actions";
import AuthSubmitButton from "@/components/auth-submit-button";
import { FormMessage, Message } from "@/components/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import SocialLoginButtons from "@/components/auth/SocialLoginButtons";
import ShieldNestLogo from "@/components/shieldnest-logo";
import { IoShieldCheckmark, IoArrowForward, IoCheckmarkCircle } from "react-icons/io5";

export default async function SignUp(props: {
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
              Start Your Coreum Journey
            </span>
          </div>
        </div>

        {/* Main Card */}
        <div className="neo-card p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Create Account
            </h1>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link 
                className="text-[#25d695] font-medium hover:underline inline-flex items-center gap-1 transition-all hover:gap-2" 
                href="/sign-in"
              >
                Sign in
                <IoArrowForward className="w-3 h-3" />
              </Link>
            </p>
          </div>

          {/* Benefits List */}
          <div className="mb-6 p-4 neo-float-green rounded-lg">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <IoShieldCheckmark className="w-4 h-4 text-[#25d695]" />
              What you'll get:
            </h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <IoCheckmarkCircle className="w-4 h-4 text-[#25d695] flex-shrink-0 mt-0.5" />
                <span>Track your Coreum portfolio across multiple wallets</span>
              </li>
              <li className="flex items-start gap-2">
                <IoCheckmarkCircle className="w-4 h-4 text-[#25d695] flex-shrink-0 mt-0.5" />
                <span>Monitor liquidity pools and yields in real-time</span>
              </li>
              <li className="flex items-start gap-2">
                <IoCheckmarkCircle className="w-4 h-4 text-[#25d695] flex-shrink-0 mt-0.5" />
                <span>Save and manage multiple addresses with labels</span>
              </li>
            </ul>
          </div>

          {/* Social Login Buttons */}
          <div className="mb-6">
            <SocialLoginButtons />
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-card text-muted-foreground">
                Or sign up with email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form action={signUpAction} className="space-y-5">
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
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-foreground font-medium mb-2 block">
                Password
              </Label>
              <Input
                type="password"
                name="password"
                placeholder="Create a strong password"
                required
                className="input-coreum h-11"
                autoComplete="new-password"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Must be at least 8 characters long
              </p>
            </div>

            <div className="pt-2">
              <AuthSubmitButton label="Create Account" pendingLabel="Creating account..." />
            </div>
            
            <FormMessage message={searchParams} />

            <p className="text-xs text-muted-foreground">
              <IoCheckmarkCircle className="w-3 h-3 inline text-[#25d695] mr-1" />
              If your email is already registered, we'll take you to sign in instead.
            </p>
          </form>
        </div>

        {/* Footer Text */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="text-[#25d695] hover:underline">
            Terms of Service
          </Link>
          {" "}and{" "}
          <Link href="/privacy" className="text-[#25d695] hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
