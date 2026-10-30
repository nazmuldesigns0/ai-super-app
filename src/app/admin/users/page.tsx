export default function AdminUsersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Registered Users</h1>
      <div className="rounded-xl border border-border p-8 text-center text-muted-foreground">
        Connect Firestore query here to list all users from the <code>users</code> collection.
      </div>
    </div>
  );
}
