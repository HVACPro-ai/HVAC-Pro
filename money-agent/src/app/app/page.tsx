import Link from "next/link";

export default async function AppHome() {
  // Server session helper omitted in this minimal scaffold; link to sign in.
  const isAuthed = false;
  if (!isAuthed) {
    return (
      <div className="max-w-xl mx-auto py-16">
        <h1 className="text-2xl font-semibold mb-2">Money Agent</h1>
        <p className="text-gray-600 mb-4">Sign in to manage your finances</p>
        <Link className="underline" href="/signin">Sign in</Link>
      </div>
    );
  }
  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-2">Welcome</h1>
      <p className="text-gray-600">Dashboard will appear here.</p>
    </div>
  );
}
