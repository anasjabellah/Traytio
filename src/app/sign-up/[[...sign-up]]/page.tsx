import { SignUp } from "@clerk/nextjs";
import { AUTH } from "@/lib/notify/messages";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="font-heading text-3xl font-semibold">
            {AUTH.SIGN_UP.TITLE}
          </h1>
          <p className="text-muted-foreground">
            {AUTH.SIGN_UP.DESCRIPTION}
          </p>
        </div>
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground",
              card: "bg-card border border-border/40 shadow-sm",
            },
          }}
        />
      </div>
    </div>
  );
}
