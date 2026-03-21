import Sidebar from './Sidebar'

interface Props {
  children: React.ReactNode
  sidebarContent?: React.ReactNode
}

export default function ChatShell({ children, sidebarContent }: Props) {
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  )
}
