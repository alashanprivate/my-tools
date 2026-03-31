export function Footer() {
  return (
    <footer className="border-t py-6 md:py-8">
      <div className="container mx-auto px-4 flex flex-col items-center justify-between gap-4 md:flex-row">
        <p className="text-sm text-muted-foreground">
          基于 TDD 方法论构建的开发者工具集合
        </p>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Developer Tools. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
