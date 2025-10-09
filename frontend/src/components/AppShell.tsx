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
} from "lucide-react";

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
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProjectsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // CORRECTLY TYPED NAVIGATION ARRAY
  const navigation: NavigationSection[] = [
    {
      section: "Overview Analysis",
      items: [
        { name: "Dashboard", href: "/", icon: Activity },
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
        <div className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Hive
              </h1>
              <p className="text-xs text-gray-900 dark:text-gray-100">
                Agentic Security Scanner
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                This is a proof of concept of our multi agent security scanner.
                We love ideas and recommendations of what you'd like to see in
                such a tool!
                <a
                  href="https://www.aegentdev.com/contact"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800 transition-colors"
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
              className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <UploadCloud size={18} className="mr-2" />
              Scan File
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
            {navigation.map((section) => (
              <div key={section.section}>
                <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
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
                          className={`
                            group flex items-center px-3 py-2.5 text-sm font-medium rounded-md 
                            transition-all duration-200 ease-in-out
                            ${
                              isActive
                                ? "bg-blue-600 text-white shadow-md scale-[1.02]"
                                : "text-gray-600 dark:text-gray-400 hover:bg-blue-600 hover:text-white hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
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

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <a
                href="https://www.aegentdev.com/blog"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800 transition-colors duration-200"
              >
                Click here to check out our research and blogs!
              </a>
            </p>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            {/* Header content will go here */}
          </header>
          <main className="flex-1 overflow-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
