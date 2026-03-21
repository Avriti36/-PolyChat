"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import ChatShell from "@/components/chat/ChatShell";
import HomeView from "@/components/chat/HomeView";
import Sidebar from "@/components/chat/Sidebar";
import { PanelLeft } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show loading while checking auth
  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F8]">
        <div className="text-[#6B6B6B]">Loading...</div>
      </div>
    );
  }

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Sidebar */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          sidebarOpen ? "w-[260px]" : "w-0"
        } overflow-hidden flex-shrink-0`}
      >
        <Sidebar />
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Floating sidebar toggle */}
        <button
          onClick={toggleSidebar}
          className={`absolute top-4 left-4 z-20 p-2 bg-white border border-[#E5E5E5] rounded-lg shadow-sm hover:bg-gray-50 transition-all ${
            sidebarOpen ? "lg:left-[276px]" : "left-4"
          }`}
          title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <PanelLeft className="w-4 h-4 text-[#6B6B6B]" />
        </button>

        <HomeView user={user} />
      </main>
    </div>
  );
}
