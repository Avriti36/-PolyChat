import Sidebar from './Sidebar'

export default function ChatShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  )
}
