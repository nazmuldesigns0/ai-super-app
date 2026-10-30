export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Each auth page renders its own <AuthShell> (animated background + card).
  return <>{children}</>;
}
