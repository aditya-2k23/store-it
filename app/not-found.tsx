import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-5 bg-light-400">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-8xl font-black text-brand">404</h1>
        <h2 className="text-2xl font-semibold text-slate-800">
          Page Not Found
        </h2>
        <p className="text-slate-500">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <Link href="/dashboard">
        <Button className="h-12 rounded-full bg-brand px-8 text-white transition-all hover:bg-brand-100 cursor-pointer">
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}
