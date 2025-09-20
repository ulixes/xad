export default function Footer() {
  return (
    <footer className="w-full py-12 bg-card border-t border-border">
      <div className="container mx-auto">
        <div className="flex flex-col items-center gap-6">
          {/* Logo */}
          <div className="text-2xl font-bold text-foreground">
            zkad
          </div>

          {/* Links */}
          <div className="flex gap-6">
            <a
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms of Service
            </a>
            <a
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </a>
          </div>

        </div>
      </div>
    </footer>
  )
}