import { signInAction } from "@/app/actions";
import AuthSubmitButton from "@/components/auth-submit-button";
import { FormMessage, Message } from "@/components/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import SocialLoginButtons from "@/components/auth/SocialLoginButtons";

export default async function SignIn(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;

  return (
    <div className="flex-1 flex flex-col w-full max-w-md mx-auto mt-24 px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-[#1b1d23]">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
        <p className="text-sm text-gray-400 mb-6">
          Don&apos;t have an account?{" "}
          <Link className="text-[#25d695] dark:text-[#25d695] font-medium hover:underline" href="/sign-up">
            Sign up
          </Link>
        </p>

        {/* Social Login Buttons */}
        <SocialLoginButtons />

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form action={signInAction} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <Input 
              name="email" 
              placeholder="you@example.com" 
              required 
              className="mt-1"
              autoComplete="email"
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="password" className="text-gray-300">Password</Label>
              <Link 
                href="/forgot-password" 
                className="text-sm text-[#25d695] dark:text-[#25d695] hover:underline"
              >
                Forgot?
              </Link>
            </div>
            <Input
              type="password"
              name="password"
              placeholder="Your password"
              required
              autoComplete="current-password"
            />
          </div>

          <AuthSubmitButton />
          <FormMessage message={searchParams} />
        </form>
      </div>
    </div>
  );
}
