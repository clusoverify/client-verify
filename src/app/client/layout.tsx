"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePortal } from "src/context/PortalContext";
import { useAuth } from "src/context/AuthContext";
import { 
  ShieldCheck, 
  Settings as SettingsIcon, 
  Receipt, 
  Bell, 
  LogOut, 
  Menu, 
  X, 
  User, 
  ArrowRight,
  Sparkles,
  Users,
  History,
  FileText
} from "lucide-react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { settings, invoices } = usePortal();
  const { isAuthenticated, isLoading, logout, profile, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; date: string; read: boolean }>>([]);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close notifications dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter invoices for the logged-in client's organisation
  const clientInvoices = invoices.filter(
    (inv) =>
      inv.orgName?.toLowerCase() === settings.companyName?.toLowerCase() ||
      inv.orgName?.toLowerCase() === profile?.org_name?.toLowerCase()
  );

  // Generate notification items from invoices list
  useEffect(() => {
    if (clientInvoices && clientInvoices.length > 0) {
      const readIds = JSON.parse(localStorage.getItem("read_notifications") || "[]");
      const mapped = clientInvoices.map((inv) => ({
        id: `inv-${inv.id}`,
        title: "New Invoice Generated",
        message: `Invoice ${inv.id} for $${inv.amount.toLocaleString()} is now available. Due date: ${inv.dueDate}.`,
        date: inv.date,
        read: readIds.includes(`inv-${inv.id}`)
      }));
      setNotifications(mapped);
    } else {
      setNotifications([]);
    }
  }, [invoices, settings.companyName, profile?.org_name]);

  const markAsRead = (id: string) => {
    const readIds = JSON.parse(localStorage.getItem("read_notifications") || "[]");
    if (!readIds.includes(id)) {
      readIds.push(id);
      localStorage.setItem("read_notifications", JSON.stringify(readIds));
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    const readIds = notifications.map((n) => n.id);
    localStorage.setItem("read_notifications", JSON.stringify(readIds));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Route protection — redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  const navItems = [
    {
      name: "Services",
      path: "/client/identity-verification",
      icon: ShieldCheck,
    },
    {
      name: "Order Summary",
      path: "/client/summary",
      icon: FileText,
    },
    {
      name: "Billable History",
      path: "/client/billing",
      icon: History,
    },
    ...(profile?.role === "org_owner"
      ? [
          {
            name: "Manage Verifiers",
            path: "/client/verifiers",
            icon: Users,
          }
        ]
      : []),
    {
      name: "Settings & Profile",
      path: "/client/settings",
      icon: SettingsIcon,
    },
  ];

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="font-body-sm text-secondary">Verifying session...</span>
        </div>
      </div>
    );
  }

  // Don't render layout if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const displayName = profile?.full_name || user?.email || "User";
  const displayOrg = profile?.org_name || settings.companyName || "Company";

  if (pathname.includes("/client/report") || pathname.includes("/client/billable-summary")) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#FBFBFB] text-[#0F172A]">
      {/* Sidebar - Desktop */}
      <aside className="w-sidebar-width h-screen fixed left-0 top-0 bg-gradient-to-b from-[#C6E7FF] to-[#D4F6FF] border-r border-[#C6E7FF] flex flex-col py-stack-lg z-30 hidden md:flex">
        <div className="px-6 mb-stack-lg">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/client/identity-verification" className="block transition-transform duration-300 hover:scale-[1.03] select-none">
              <img 
                src="/cluso-infolink.png" 
                alt="Cluso Infolink Logo" 
                className="h-18 w-auto max-w-full object-contain rounded-2xl shadow-xs hover:shadow-sm transition-shadow duration-300"
              />
            </Link>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-2 mt-stack-md">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 mx-4 px-4 py-3 rounded-2xl transition-all duration-300 relative group font-semibold text-sm hover:translate-x-1.5 ${
                  isActive
                    ? "bg-white/85 text-[#0F172A] shadow-md border-r-4 border-[#FFDDAE] translate-x-1.5"
                    : "text-[#1E3A5F] hover:bg-white/50 hover:text-[#0F172A] hover:shadow-xs"
                }`}
              >
                <item.icon className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-[#0F172A]" : "text-[#1E3A5F]"}`} />
                <span className="tracking-wide">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User info + Footer actions inside sidebar */}
        <div className="mt-auto mx-4 mb-6 p-4 bg-white/50 border border-white/80 rounded-2xl flex flex-col gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-[#FFDDAE] to-[#C6E7FF] rounded-xl flex items-center justify-center text-[#0F172A] font-bold shadow-xs">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-body-sm font-bold text-[#0F172A] truncate">{displayName}</span>
              <span className="text-[10px] text-[#1E3A5F] truncate font-medium">{user?.email}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 bg-white/70 hover:bg-red-50 text-[#1E3A5F] hover:text-red-600 border border-white/60 rounded-xl transition-all duration-200 w-full text-left font-body-sm cursor-pointer shadow-2xs font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Sidebar - Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-400/10 backdrop-blur-xs z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <aside
            className="w-64 h-full bg-gradient-to-b from-[#C6E7FF] to-[#D4F6FF] border-r border-[#C6E7FF] flex flex-col py-stack-lg animate-slide-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 mb-6 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Link href="/client/identity-verification" className="block transition-transform duration-300 hover:scale-[1.03] select-none" onClick={() => setMobileMenuOpen(false)}>
                  <img 
                    src="/cluso-infolink.png" 
                    alt="Cluso Infolink Logo" 
                    className="h-16 w-auto max-w-full object-contain rounded-2xl shadow-xs hover:shadow-sm transition-shadow duration-300"
                  />
                </Link>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-[#0F172A] p-2 rounded-xl hover:bg-white/40 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 mx-4 px-4 py-3 rounded-2xl transition-all duration-300 relative group font-semibold text-sm hover:translate-x-1.5 ${
                      isActive
                        ? "bg-white/85 text-[#0F172A] shadow-md border-r-4 border-[#FFDDAE] translate-x-1.5"
                        : "text-[#1E3A5F] hover:bg-white/50 hover:text-[#0F172A]"
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${isActive ? "text-[#0F172A]" : "text-[#1E3A5F]"}`} />
                    <span className="tracking-wide">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mx-4 mb-6 p-4 bg-white/50 border border-white/80 rounded-2xl flex flex-col gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-tr from-[#FFDDAE] to-[#C6E7FF] rounded-xl flex items-center justify-center text-[#0F172A] font-bold shadow-xs">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-body-sm font-bold text-[#0F172A] truncate">{displayName}</span>
                  <span className="text-[10px] text-[#1E3A5F] truncate font-medium">{user?.email}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 bg-white/70 hover:bg-red-50 text-[#1E3A5F] hover:text-red-600 border border-white/60 rounded-xl transition-all duration-200 w-full text-left font-body-sm cursor-pointer shadow-2xs font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Page Canvas Container */}
      <div className="flex-1 md:ml-sidebar-width flex flex-col min-h-screen">
        {/* Floating Top AppBar */}
        <header className="h-16 fixed top-0 right-0 w-[calc(100%-32px)] md:w-[calc(100%-292px)] mx-4 my-3 bg-white/85 backdrop-blur-md border border-[#C6E7FF] rounded-2xl z-20 flex justify-between items-center px-6 transition-all duration-200 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 text-primary hover:bg-[#D4F6FF]/40 rounded-xl md:hidden transition-colors"
            >
              <Menu className="w-5 h-5 text-[#0F172A]" />
            </button>
            <div className="flex items-center gap-2">
              <Link href="/client/identity-verification" className="block transition-transform duration-300 hover:scale-[1.05] hover:rotate-1 select-none">
                <img 
                  src="/cluso-infolink-short.png" 
                  alt="Cluso Infolink Short Logo" 
                  className="h-9 w-auto object-contain rounded-lg shadow-2xs"
                />
              </Link>
              <span className="font-headline-md font-bold text-[#0F172A] tracking-tight hidden sm:inline">Verify with Cluso Infolink</span>
              <span className="font-headline-md font-bold text-[#0F172A] tracking-tight sm:hidden">Verify</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications Dropdown Container */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="notifications"
                className={`text-[#334155] hover:text-[#0F172A] hover:bg-[#D4F6FF]/40 p-2 rounded-xl transition-all duration-200 relative flex items-center justify-center border border-transparent ${showNotifications ? 'bg-[#D4F6FF]/40 border-[#C6E7FF]/60 text-[#0F172A]' : ''}`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FFDDAE] rounded-full ring-2 ring-white animate-pulse shadow-sm"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-[#C6E7FF] rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in text-on-surface">
                  {/* Dropdown Header */}
                  <div className="px-4 py-3 border-b border-[#D4F6FF] flex justify-between items-center bg-[#D4F6FF]/20">
                    <span className="font-body-sm font-bold text-primary">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-primary hover:underline font-semibold"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  {/* Dropdown Content */}
                  <div className="max-h-72 overflow-y-auto divide-y divide-[#D4F6FF]/50">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-secondary font-body-sm flex flex-col items-center gap-2">
                        <Bell className="w-8 h-8 text-slate-300" />
                        <span>No new notifications</span>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`px-4 py-3 hover:bg-[#D4F6FF]/10 transition-colors flex gap-3 ${
                            !notif.read ? "bg-[#C6E7FF]/10" : ""
                          }`}
                        >
                          <div className="mt-0.5 text-primary">
                            <Receipt className="w-4 h-4 text-[#0F172A]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-0.5">
                              <span className="font-body-sm font-bold text-primary truncate">Invoice Generated</span>
                              <span className="text-[10px] text-secondary whitespace-nowrap ml-2">{notif.date}</span>
                            </div>
                            <p className="font-body-xs text-secondary mb-2 leading-relaxed text-left">{notif.message}</p>
                            <div className="flex gap-3 items-center">
                              <Link
                                href="/client/summary"
                                onClick={() => setShowNotifications(false)}
                                className="text-[11px] text-primary font-semibold hover:underline flex items-center gap-0.5"
                              >
                                <span>View Invoices</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                              {!notif.read && (
                                <button
                                  onClick={() => markAsRead(notif.id)}
                                  className="text-[11px] text-secondary hover:text-primary font-semibold hover:underline"
                                >
                                  Mark read
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* User info badge */}
            <div className="hidden sm:flex items-center gap-3 px-3 py-1 bg-[#D4F6FF]/30 border border-[#C6E7FF]/60 rounded-xl mr-1">
              <div className="flex flex-col text-right">
                <span className="font-body-sm font-bold text-primary leading-tight">{displayOrg}</span>
                <span className="text-[9px] text-[#334155] font-bold tracking-wider font-label-caps uppercase">Client Account</span>
              </div>
            </div>

            {/* Profile Avatar navigates to Settings & Profile */}
            <Link
              href="/client/settings"
              aria-label="Settings & Profile"
              className="text-[#334155] hover:text-[#0F172A] hover:bg-[#D4F6FF]/40 p-2 rounded-xl transition-all duration-200 flex items-center gap-1 group animate-fade-in"
            >
              <User className="w-5 h-5 text-[#0F172A]" />
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 mt-20 p-margin-mobile md:p-gutter max-w-container-max mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
