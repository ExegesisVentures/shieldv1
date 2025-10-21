import { resetPasswordAction } from "@/app/actions";
import AuthSubmitButton from "@/components/auth-submit-button";
import { FormMessage, Message } from "@/components/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function ResetPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;

  return (
    <div className="flex-1 flex flex-col w-full max-w-md mx-auto mt-24 px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-[#1b1d23]">
        <h1 className="text-3xl font-bold text-white mb-2">Set New Password</h1>
        <p className="text-sm text-gray-400 mb-6">
          Please enter your new password below.
        </p>

        <form action={resetPasswordAction} className="space-y-4">
          <div>
            <Label htmlFor="password" className="text-gray-300">New Password</Label>
            <Input 
              type="password"
              name="password" 
              placeholder="Enter new password" 
              required 
              className="mt-1"
              autoComplete="new-password"
              minLength={6}
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-gray-300">Confirm Password</Label>
            <Input 
              type="password"
              name="confirmPassword" 
              placeholder="Confirm new password" 
              required 
              className="mt-1"
              autoComplete="new-password"
              minLength={6}
            />
          </div>

          <AuthSubmitButton label="Update Password" pendingLabel="Updating..." />
          <FormMessage message={searchParams} />
        </form>
      </div>
    </div>
  );
}

