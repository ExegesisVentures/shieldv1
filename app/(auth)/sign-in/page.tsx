import { signInAction } from "@/app/actions";
import AuthSubmitButton from "@/components/auth-submit-button";
import { FormMessage, Message } from "@/components/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import SocialLoginButtons from "@/components/auth/SocialLoginButtons";
import ShieldNestLogo from "@/components/shieldnest-logo";
import { IoShieldCheckmark, IoArrowForward } from "react-icons/io5";

export default async function SignIn(props: {
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
              Coreum Portfolio Platform
            </span>
          </div>
        </div>

        {/* Main Card */}
        <div className="neo-card p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome Back
            </h1>
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link 
                className="text-[#25d695] font-medium hover:underline inline-flex items-center gap-1 transition-all hover:gap-2" 
                href="/sign-up"
              >
                Sign up
                <IoArrowForward className="w-3 h-3" />
              </Link>
            </p>
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
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form action={signInAction} className="space-y-5">
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
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="password" className="text-foreground font-medium">
                  Password
                </Label>
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-[#25d695] hover:underline transition-all hover:text-[#1fb881]"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                name="password"
                placeholder="Enter your password"
                required
                className="input-coreum h-11"
                autoComplete="current-password"
              />
            </div>

            <AuthSubmitButton />
            <FormMessage message={searchParams} />
          </form>
        </div>

        {/* Footer Text */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          By signing in, you agree to our{" "}
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
