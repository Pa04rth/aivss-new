"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UploadAndScan from "./UploadAndScan";
import N8nWorkflowScan from "./n8n/N8nWorkflowScan";

export default function ScanInterface() {
  const [activeTab, setActiveTab] = useState("python");

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="python">Python Files</TabsTrigger>
          <TabsTrigger value="n8n">n8n Workflows</TabsTrigger>
          <TabsTrigger value="zapier" disabled>
            Zapier (Coming Soon)
          </TabsTrigger>
          <TabsTrigger value="make" disabled>
            Make.com (Coming Soon)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="python">
          <UploadAndScan />
        </TabsContent>

        <TabsContent value="n8n">
          <N8nWorkflowScan />
        </TabsContent>

        <TabsContent value="zapier">
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
              Zapier Integration
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Coming soon! We're working on Zapier workflow analysis.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="make">
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
              Make.com Integration
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Coming soon! We're working on Make.com workflow analysis.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
