"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sun, Moon, Shield, AlertTriangle, CheckCircle } from "lucide-react";

export default function ThemeDemo() {
  const [showDemo, setShowDemo] = useState(false);

  if (!showDemo) {
    return (
      <div className="p-8 space-y-8 text-gray-900 dark:text-gray-100">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Theme Toggle Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Click the button below to see how the theme affects different
            components
          </p>
          <Button onClick={() => setShowDemo(true)}>Show Theme Demo</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 text-gray-900 dark:text-gray-100">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          Theme Toggle Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Toggle between light and dark themes using the button in the header
        </p>
        <Button onClick={() => setShowDemo(false)} variant="outline">
          Hide Demo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Cards */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Comprehensive security scanning for your automation workflows.
            </p>
            <div className="space-y-2">
              <Badge variant="destructive" className="w-full justify-center">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Critical Issues Found
              </Badge>
              <Badge variant="secondary" className="w-full justify-center">
                <CheckCircle className="w-3 h-3 mr-1" />
                Security Checks Passed
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Sun className="w-5 h-5" />
              Light Theme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Clean, bright interface perfect for daytime use.
            </p>
            <div className="space-y-2">
              <div className="bg-blue-600 text-white dark:bg-blue-500 p-3 rounded text-center text-sm">
                Primary Button
              </div>
              <div className="bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 p-3 rounded text-center text-sm">
                Secondary Button
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Moon className="w-5 h-5" />
              Dark Theme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Easy on the eyes for nighttime or low-light environments.
            </p>
            <div className="space-y-2">
              <div className="bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100 p-3 rounded text-center text-sm">
                Muted Background
              </div>
              <div className="border border-gray-300 dark:border-gray-600 p-3 rounded text-center text-sm">
                Border Example
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Color Palette */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Color Palette
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="bg-blue-600 dark:bg-blue-500 h-16 rounded mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Primary</p>
          </div>
          <div className="text-center">
            <div className="bg-gray-100 dark:bg-gray-800 h-16 rounded mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Secondary
            </p>
          </div>
          <div className="text-center">
            <div className="bg-gray-200 dark:bg-gray-700 h-16 rounded mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Muted</p>
          </div>
          <div className="text-center">
            <div className="bg-red-600 dark:bg-red-500 h-16 rounded mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Destructive
            </p>
          </div>
        </div>
      </div>

      {/* Typography */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Typography
        </h2>
        <div className="space-y-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
              Heading 1
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Large heading for main titles
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Heading 2
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Medium heading for sections
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Heading 3
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Small heading for subsections
            </p>
          </div>
          <div>
            <p className="text-gray-900 dark:text-gray-100">
              Regular paragraph text with normal weight
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Muted text for descriptions and captions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
