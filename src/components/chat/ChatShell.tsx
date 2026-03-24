import Sidebar from './Sidebar'

interface Props {
  children: React.ReactNode
}

export default function ChatShell({ children }: Props) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#161616]">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 bg-[#161616]">
        {children}
      </main>
    </div>
  )
}