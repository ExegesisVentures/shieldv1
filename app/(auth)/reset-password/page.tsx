import { resetPasswordAction } from "@/app/actions";
import AuthSubmitButton from "@/components/auth-submit-button";
import { FormMessage, Message } from "@/components/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ShieldNestLogo from "@/components/shieldnest-logo";
import { IoShieldCheckmark, IoLockClosed, IoCheckmarkCircle } from "react-icons/io5";

export default async function ResetPassword(props: {
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
              Secure Password Reset
            </span>
          </div>
        </div>

        {/* Main Card */}
        <div className="neo-card p-8">
          <div className="mb-8">
            <div className="neo-icon-glow-green mb-6 inline-flex">
              <IoLockClosed className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Set New Password
            </h1>
            <p className="text-sm text-muted-foreground">
              Please enter your new password below. Make it strong and secure!
            </p>
          </div>

          {/* Password Requirements */}
          <div className="mb-6 p-4 neo-float-blue rounded-lg">
            <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
              <IoCheckmarkCircle className="w-4 h-4 text-[#25d695]" />
              Password Requirements:
            </h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-muted-foreground"></span>
                At least 8 characters long
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-muted-foreground"></span>
                Mix of uppercase and lowercase letters
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-muted-foreground"></span>
                Include numbers and special characters
              </li>
            </ul>
          </div>

          <form action={resetPasswordAction} className="space-y-5">
            <div>
              <Label htmlFor="password" className="text-foreground font-medium mb-2 block">
                New Password
              </Label>
              <Input 
                type="password"
                name="password" 
                placeholder="Enter new password" 
                required 
                className="input-coreum h-11"
                autoComplete="new-password"
                minLength={8}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-foreground font-medium mb-2 block">
                Confirm Password
              </Label>
              <Input 
                type="password"
                name="confirmPassword" 
                placeholder="Confirm new password" 
                required 
                className="input-coreum h-11"
                autoComplete="new-password"
                minLength={8}
              />
            </div>

            <div className="pt-2">
              <AuthSubmitButton label="Update Password" pendingLabel="Updating..." />
            </div>
            <FormMessage message={searchParams} />
          </form>
        </div>

        {/* Footer Text */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Your password will be encrypted and stored securely
        </p>
      </div>
    </div>
  );
}

