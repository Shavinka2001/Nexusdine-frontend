import { ReactNode } from "react";
import Link from "next/link";
import { AuthMarketingPanel } from "./AuthMarketingPanel";

interface AuthSplitLayoutProps {
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthSplitLayout({ children, footer }: AuthSplitLayoutProps) {
  return (
    <div className="flex min-h-dvh bg-surface">
      <AuthMarketingPanel />

      <div className="flex min-h-dvh w-full flex-col lg:w-[52%] xl:w-1/2">
        <header className="flex items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
          <Link
            href="/login"
            className="font-display text-2xl tracking-tight text-secondary lg:hidden"
          >
            Nexus<span className="text-primary">Dine</span>
          </Link>
          <div className="ml-auto text-sm text-secondary-400">
            Need help?{" "}
            <a
              href="mailto:support@nexusdine.app"
              className="font-medium text-primary hover:text-primary-600"
            >
              Contact support
            </a>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-5 pb-10 pt-2 sm:px-8 lg:px-10">
          <div className="w-full max-w-md">{children}</div>
        </main>

        {footer ? (
          <footer className="px-5 pb-8 text-center text-sm text-secondary-400 sm:px-8">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
