import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, Shield, Activity, Settings, BarChart3 } from "lucide-react";

export default function HardeningToolsPage() {
  const features = [
    {
      title: "Advanced Protection",
      description: "Multi-layered prompt injection detection and prevention",
      icon: Shield,
    },
    {
      title: "Real-time Monitoring",
      description: "Continuous threat detection and alerting",
      icon: Activity,
    },
    {
      title: "Custom Rules",
      description: "Define your own security policies and patterns",
      icon: Settings,
    },
    {
      title: "Analytics Dashboard",
      description: "Comprehensive security insights and reporting",
      icon: BarChart3,
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-5xl w-full text-center space-y-8">
        {/* Header Icon */}
        <div className="flex justify-center">
          <div className="p-6 bg-primary/10 rounded-full">
            <Clock size={64} className="text-primary" />
          </div>
        </div>

        {/* Title and Description */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Hardening Tools
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto">
            Comprehensive security hardening toolkit for AI agent systems
            including configuration guides, best practices, and automated
            security enhancements.
          </p>
        </div>

        {/* Coming Soon Badge */}
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 border-2 border-primary/20 rounded-full">
          <Clock size={20} className="text-primary" />
          <span className="text-primary font-semibold text-lg">
            Coming Soon
          </span>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="bg-card hover:bg-muted/50 transition-colors border-2"
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon size={24} className="text-primary" />
                    </div>
                    <CardTitle className="text-left text-lg">
                      {feature.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-left">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Progress Indicators */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Activity size={20} />
              Development Progress
            </CardTitle>
            <CardDescription>
              We're working hard to bring you this feature
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 p-3 bg-muted rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm">Feature development in progress</span>
              </div>
              <div className="flex items-center justify-center gap-3 p-3 bg-muted rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-sm">Security testing and validation</span>
              </div>
              <div className="flex items-center justify-center gap-3 p-3 bg-muted rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm">
                  Final integration and deployment
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Text */}
        <p className="text-sm text-muted-foreground mt-8">
          Check back soon for updates, or{" "}
          <a
            href="https://www.aegentdev.com/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:text-primary/80"
          >
            contact us
          </a>{" "}
          for more information about this feature.
        </p>
      </div>
    </div>
  );
}
