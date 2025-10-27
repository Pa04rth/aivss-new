"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Search,
  Eye,
  Triangle,
  Wrench,
  FileText,
  ChevronDown,
  Folder,
  Link as LinkIcon,
  Database,
  Unlock,
  CheckCircle,
  UploadCloud,
  LogOut,
  User,
} from "lucide-react";
import { getCurrentUser, logout, User as AuthUser } from "../lib/auth";

// TYPE DEFINITION FOR A SINGLE NAVIGATION LINK
interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  tag?: string;
}

// NEW, CORRECT TYPE DEFINITION FOR A SECTION OF LINKS
interface NavigationSection {
  section: string;
  items: NavigationItem[];
}

export default function AppShell({ children }: { children: ReactNode }) {
  const [isProjectsDropdownOpen, setIsProjectsDropdownOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState("Multi Agent System");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProjectsDropdownOpen(false);
      }
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Reset navigation loading when pathname changes - with delay to show loader
  useEffect(() => {
    // Add a small delay to keep the loading indicator visible
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    // Load user info
    console.log("Loading user info...");
    getCurrentUser()
      .then((userData) => {
        console.log("User data loaded:", userData);
        setUser(userData);
      })
      .catch((error) => {
        console.error("Failed to load user:", error);
      });
  }, []);

  // CORRECTLY TYPED NAVIGATION ARRAY
  const navigation: NavigationSection[] = [
    {
      section: "Overview Analysis",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: Activity },
        { name: "System Schema", href: "/system-schema", icon: LinkIcon },
        { name: "My Scans", href: "/my-scans", icon: Folder },
      ],
    },
    {
      section: "Attack Vectors",
      items: [
        {
          name: "Data Poisoning",
          href: "/data-poisoning",
          icon: Database,
          tag: "Medium",
        },
        {
          name: "Jailbreaks",
          href: "/jailbreaks",
          icon: Unlock,
          tag: "Critical",
        },
      ],
    },
    {
      section: "Security & Monitoring",
      items: [
        { name: "Hardening Tools", href: "/hardening-tools", icon: Wrench },
        {
          name: "Prompt Hardening",
          href: "/prompt-hardening",
          icon: CheckCircle,
        },
        { name: "Risk Reports", href: "/risk-reports", icon: FileText },
        { name: "System Monitor", href: "/system-monitor", icon: Activity },
      ],
    },
  ];

  const projects = [
    {
      id: "multi-agent-system",
      name: "Multi Agent System",
      description: "Comprehensive multi-agent security scanner",
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Hive</h1>
              <p className="text-xs text-gray-900">Agentic Security Scanner</p>
              <p className="text-xs text-gray-600 mt-2">
                This is a proof of concept of our multi agent security scanner.
                We love ideas and recommendations of what you'd like to see in
                such a tool!
                <a
                  href="https://www.aegentdev.com/contact"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-700 transition-colors"
                >
                  {" "}
                  Click here to contact us!
                </a>
              </p>
            </div>
          </div>

          {/* Scan File Button */}
          <div className="p-4">
            <Link
              href="/scan-file"
              className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-md hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <UploadCloud size={18} className="mr-2" />
              Scan File
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
            {navigation.map((section) => (
              <div key={section.section}>
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
                  {section.section}
                </h3>
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          prefetch={true}
                          onClick={() => setIsNavigating(true)}
                          className={`
                            group flex items-center px-3 py-2.5 text-sm font-medium rounded-md 
                            transition-all duration-200 ease-in-out
                            ${
                              isActive
                                ? "bg-blue-600 text-white shadow-md scale-[1.02]"
                                : "text-gray-600 hover:bg-blue-600 hover:text-white hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
                            }
                          `}
                        >
                          <Icon
                            size={18}
                            className={`mr-3 transition-transform duration-200 ${
                              !isActive && "group-hover:scale-110"
                            }`}
                          />
                          <span className="flex-1">{item.name}</span>
                          {item.tag && (
                            <span
                              className={`px-2 py-1 text-xs rounded-full font-semibold transition-colors duration-200 ${
                                item.tag === "Critical"
                                  ? isActive
                                    ? "bg-red-100 text-red-800"
                                    : "bg-red-100 text-red-800 group-hover:bg-red-200"
                                  : isActive
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-yellow-100 text-yellow-800 group-hover:bg-yellow-200"
                              }`}
                            >
                              {item.tag}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              <a
                href="https://www.aegentdev.com/blog"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-700 transition-colors duration-200"
              >
                Click here to check out our research and blogs!
              </a>
            </p>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {pathname === "/"
                    ? "Dashboard"
                    : pathname === "/scan-file"
                    ? "Security Scanner"
                    : pathname === "/my-scans"
                    ? "My Scans"
                    : pathname === "/system-schema"
                    ? "System Schema"
                    : pathname === "/data-poisoning"
                    ? "Data Poisoning"
                    : pathname === "/jailbreaks"
                    ? "Jailbreaks"
                    : pathname === "/hardening-tools"
                    ? "Hardening Tools"
                    : pathname === "/prompt-hardening"
                    ? "Prompt Hardening"
                    : pathname === "/risk-reports"
                    ? "Risk Reports"
                    : pathname === "/system-monitor"
                    ? "System Monitor"
                    : "Security Scanner"}
                </h2>
              </div>
              <div className="flex items-center space-x-2">
                {/* User dropdown */}
                <div className="relative" ref={userDropdownRef}>
                  <button
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <User size={18} className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {user?.email || "User"}
                    </span>
                    <ChevronDown size={16} className="text-gray-500" />
                  </button>

                  {isUserDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                      <div className="py-1">
                        <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                          <div className="font-medium">{user?.email}</div>
                          <div className="text-xs text-gray-500">Signed in</div>
                        </div>
                        <button
                          onClick={() => {
                            logout();
                            setIsUserDropdownOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <LogOut size={16} className="mr-2" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-white text-gray-900 relative">
            {/* Navigation Loading Indicator */}
            {isNavigating && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm font-medium text-gray-900">
                    Loading...
                  </p>
                </div>
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
