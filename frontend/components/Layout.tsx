import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Upload,
  Edit,
  TrendingUp,
  Package,
  Calculator,
  ShoppingCart,
  PackageCheck,
  FileText,
  CreditCard,
  Database,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  {
    name: "Upload Data",
    href: "/",
    icon: Upload,
    description: "Load Excel Customer Demand and Product Data",
  },
  {
    name: "S&OP",
    href: "/modify-demand",
    icon: Edit,
    description: "Edit demand data",
    disabled: false,
  },
  {
    name: "Forecast",
    href: "/forecast",
    icon: TrendingUp,
    description: "Calculate Forecast and other MRP Parameters",
    disabled: false,
  },
  {
    name: "Inventory",
    href: "/inventory",
    icon: Package,
    description: "Load product inventory",
    disabled: true,
  },
  {
    name: "EOQ/SS/ROP",
    href: "/eoq-calculation",
    icon: Calculator,
    description: "Calculate EOQ, Safety Stock, ROP",
    disabled: true,
  },
  {
    name: "Purchase Orders",
    href: "/purchase-orders",
    icon: ShoppingCart,
    description: "Create purchase orders",
    disabled: true,
  },
  {
    name: "Receive Products",
    href: "/receive-products",
    icon: PackageCheck,
    description: "Receive products into inventory",
    disabled: true,
  },
  {
    name: "Invoices",
    href: "/invoices",
    icon: FileText,
    description: "Receive and manage invoices",
    disabled: true,
  },
  {
    name: "Payments",
    href: "/payments",
    icon: CreditCard,
    description: "Make payments",
    disabled: true,
  },
  {
    name: "Database",
    href: "/database",
    icon: Database,
    description: "Database interface",
    disabled: false,
  },
];

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-80 bg-card border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b">
            <h1 className="text-xl font-bold text-foreground">Supply Chain MRP</h1>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  to={item.disabled ? "#" : item.href}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm rounded-lg transition-colors group",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : item.disabled
                      ? "text-muted-foreground cursor-not-allowed opacity-50"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={(e) => {
                    if (item.disabled) {
                      e.preventDefault();
                    } else {
                      setSidebarOpen(false);
                    }
                  }}
                >
                  <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs opacity-75 mt-0.5">
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <div className="text-xs text-muted-foreground">
              Step 1-3: Upload, Modify & Forecast Demand Data
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Other steps will be enabled progressively
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 border-b bg-card">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Supply Chain MRP</h1>
          <div className="w-10" />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
