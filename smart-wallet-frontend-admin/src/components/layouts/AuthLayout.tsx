import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  title?: string;
  description?: string;
};

const AuthLayout = ({ children }: Props) => {
  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-10">
        {children}
      </main>
    </div>
  );
};

export default AuthLayout;
