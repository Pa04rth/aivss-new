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
      <div className="p-8 space-y-8 theme-text">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold theme-text">Theme Toggle Demo</h1>
          <p className="text-muted-foreground text-lg">
            Click the button below to see how the theme affects different
            components
          </p>
          <Button onClick={() => setShowDemo(true)} className="theme-primary">
            Show Theme Demo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 theme-text">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold theme-text">Theme Toggle Demo</h1>
        <p className="text-muted-foreground text-lg">
          Toggle between light and dark themes using the button in the header
        </p>
        <Button onClick={() => setShowDemo(false)} variant="outline">
          Hide Demo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Cards */}
        <Card className="theme-card">
          <CardHeader>
            <CardTitle className="theme-text flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
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

        <Card className="theme-card">
          <CardHeader>
            <CardTitle className="theme-text flex items-center gap-2">
              <Sun className="w-5 h-5" />
              Light Theme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Clean, bright interface perfect for daytime use.
            </p>
            <div className="space-y-2">
              <div className="theme-primary p-3 rounded text-center text-sm">
                Primary Button
              </div>
              <div className="theme-secondary p-3 rounded text-center text-sm">
                Secondary Button
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="theme-card">
          <CardHeader>
            <CardTitle className="theme-text flex items-center gap-2">
              <Moon className="w-5 h-5" />
              Dark Theme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Easy on the eyes for nighttime or low-light environments.
            </p>
            <div className="space-y-2">
              <div className="theme-muted p-3 rounded text-center text-sm">
                Muted Background
              </div>
              <div className="border border-border p-3 rounded text-center text-sm">
                Border Example
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Color Palette */}
      <div className="theme-card p-6 rounded-lg">
        <h2 className="text-2xl font-bold theme-text mb-4">Color Palette</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="theme-primary h-16 rounded mb-2"></div>
            <p className="text-sm text-muted-foreground">Primary</p>
          </div>
          <div className="text-center">
            <div className="theme-secondary h-16 rounded mb-2"></div>
            <p className="text-sm text-muted-foreground">Secondary</p>
          </div>
          <div className="text-center">
            <div className="theme-muted h-16 rounded mb-2"></div>
            <p className="text-sm text-muted-foreground">Muted</p>
          </div>
          <div className="text-center">
            <div className="bg-destructive h-16 rounded mb-2"></div>
            <p className="text-sm text-muted-foreground">Destructive</p>
          </div>
        </div>
      </div>

      {/* Typography */}
      <div className="theme-card p-6 rounded-lg">
        <h2 className="text-2xl font-bold theme-text mb-4">Typography</h2>
        <div className="space-y-4">
          <div>
            <h1 className="text-4xl font-bold theme-text">Heading 1</h1>
            <p className="text-muted-foreground">
              Large heading for main titles
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold theme-text">Heading 2</h2>
            <p className="text-muted-foreground">Medium heading for sections</p>
          </div>
          <div>
            <h3 className="text-lg font-medium theme-text">Heading 3</h3>
            <p className="text-muted-foreground">
              Small heading for subsections
            </p>
          </div>
          <div>
            <p className="theme-text">
              Regular paragraph text with normal weight
            </p>
            <p className="text-muted-foreground">
              Muted text for descriptions and captions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
