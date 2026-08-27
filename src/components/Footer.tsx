export default function Footer() {
  return (
    <footer className="border-t border-border px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-text-muted">
          &copy; {new Date().getFullYear()} CodeWeavers, Inc. All rights
          reserved.
        </p>
        <div className="flex gap-6">
          <a
            href="https://www.codeweavers.com"
            className="text-sm text-text-muted transition-colors hover:text-accent"
            target="_blank"
            rel="noopener noreferrer"
          >
            codeweavers.com
          </a>
          <a
            href="mailto:enterprise@codeweavers.com"
            className="text-sm text-text-muted transition-colors hover:text-accent"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
