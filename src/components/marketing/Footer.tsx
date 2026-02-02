import Link from "next/link";

export default function MarketingFooter() {
  return (
    <footer className="mt-8 py-10 text-xs text-slate-500 border-t border-slate-100">
      <div className="mx-auto max-w-md px-4">
        <div className="flex gap-5">
          <Link className="hover:text-slate-700" href="/privacy">
            Privacy
          </Link>
          <Link className="hover:text-slate-700" href="/terms">
            Terms
          </Link>
          <Link className="hover:text-slate-700" href="/contact">
            Contact
          </Link>
        </div>

        <p className="mt-3">© {new Date().getFullYear()} Golf Brain</p>
      </div>
    </footer>
  );
}