import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - Workshop Management System",
  description: "Masuk ke Workshop Management System",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
