import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-black/10 bg-white">
      <div className="site-container py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-black/65">
          <p>Decision Clarities</p>
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-4">
            <Link className="hover:text-black" href="/compare">
              Compare
            </Link>
            <Link className="hover:text-black" href="/tools">
              Tools
            </Link>
            <Link className="hover:text-black" href="/about">
              About
            </Link>
            <Link className="hover:text-black" href="/contact">
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
