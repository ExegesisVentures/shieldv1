import { forgotPasswordAction } from "@/app/actions";
import AuthSubmitButton from "@/components/auth-submit-button";
import { FormMessage, Message } from "@/components/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function ForgotPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;

  return (
    <div className="flex-1 flex flex-col w-full max-w-md mx-auto mt-24 px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-[#1b1d23]">
        <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
        <p className="text-sm text-gray-400 mb-6">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>

        <form action={forgotPasswordAction} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <Input 
              name="email" 
              placeholder="you@example.com" 
              required 
              className="mt-1"
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
            className="text-sm text-[#25d695] dark:text-[#25d695] hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

