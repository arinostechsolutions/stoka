export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8 relative overflow-hidden">
      {/* Background decorativo */}
      <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
      <div className="absolute inset-0 w-full h-full bg-grid-white/[0.02] bg-[size:50px_50px]" />
      
      {/* Conteúdo */}
      <div className="relative z-10 w-full max-w-2xl mx-auto flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}

