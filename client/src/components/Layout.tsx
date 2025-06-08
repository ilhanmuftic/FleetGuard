import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Car, Bell, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface LayoutProps {
  children: ReactNode;
  title: string;
  actions?: ReactNode;
}

export default function Layout({ children, title, actions }: LayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigationItems = user?.role === "admin"
    ? [
      { icon: "fas fa-tachometer-alt", label: "Dashboard", active: true },
      { icon: "fas fa-car", label: "Vehicles", active: false },
      { icon: "fas fa-clipboard-list", label: "Requests", active: false },
      { icon: "fas fa-history", label: "History", active: false },
    ]
    : [
      { icon: "fas fa-tachometer-alt", label: "Dashboard", active: true },
      { icon: "fas fa-plus-circle", label: "Request Vehicle", active: false },
      { icon: "fas fa-clipboard-list", label: "My Bookings", active: false },
      { icon: "fas fa-history", label: "History", active: false },
    ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Car className="h-4 w-4 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-gray-900">Smart&Safe</h1>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item, index) => (
              <a
                key={index}
                href="#"
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${item.active
                  ? "text-white bg-primary"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
              >
                <i className={`${item.icon} mr-3`}></i>
                {item.label}
              </a>
            ))}
          </nav>

          {/* User Profile */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                <i className={`fas ${user?.role === "admin" ? "fa-user-shield" : "fa-user"} text-gray-600`}></i>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-gray-400 hover:text-gray-600"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <button
                  className="lg:hidden mr-3 p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-6 w-6" />
                </button>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h2>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="hidden sm:block">
                  {actions}
                </div>
                <div className="relative">
                  <Button variant="ghost" size="sm" className="relative p-2 text-gray-400 hover:text-gray-600">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-medium">3</span>
                    </span>
                  </Button>
                </div>
              </div>
            </div>
            {/* Mobile actions */}
            <div className="sm:hidden mt-3">
              {actions}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
