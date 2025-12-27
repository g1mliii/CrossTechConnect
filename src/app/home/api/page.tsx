"use client";

import React from "react";
import { Copy, Check } from "lucide-react";

export default function ApiPage() {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText("curl https://api.crosstechconnect.com/v1/devices/search?q=ps5");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="container mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row gap-12">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 shrink-0 hidden md:block">
                    <div className="sticky top-24 space-y-8">
                        <div>
                            <h3 className="font-bold mb-4 text-white">Getting Started</h3>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><a href="#" className="hover:text-blue-400 text-blue-400">Introduction</a></li>
                                <li><a href="#" className="hover:text-white">Authentication</a></li>
                                <li><a href="#" className="hover:text-white">Rate Limits</a></li>
                                <li><a href="#" className="hover:text-white">Errors</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold mb-4 text-white">Endpoints</h3>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><a href="#" className="hover:text-white">GET /devices</a></li>
                                <li><a href="#" className="hover:text-white">GET /devices/{`{id}`}</a></li>
                                <li><a href="#" className="hover:text-white">POST /compatibility</a></li>
                                <li><a href="#" className="hover:text-white">GET /categories</a></li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-grow max-w-4xl">
                    <div className="mb-12">
                        <h1 className="text-4xl font-bold mb-4">API Reference</h1>
                        <p className="text-gray-400 text-lg">
                            The CrossTechConnect API allows you to programmatically access our massive database of device specifications and compatibility data.
                        </p>
                    </div>

                    <div className="space-y-12">
                        <section>
                            <h2 className="text-2xl font-bold mb-4">Authentication</h2>
                            <p className="text-gray-400 mb-4">
                                All API requests require an API key to be included in the header. You can generate an API key from your dashboard settings.
                            </p>
                            <div className="bg-black/50 border border-white/10 rounded-xl p-4 font-mono text-sm text-gray-300">
                                Authorization: Bearer YOUR_API_KEY
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4">Search Devices</h2>
                            <p className="text-gray-400 mb-4">
                                Search for devices by name, brand, or category.
                            </p>

                            <div className="flex items-center gap-2 mb-4">
                                <span className="px-2 py-1 bg-green-500/20 text-green-400 font-bold rounded text-sm">GET</span>
                                <code className="text-gray-300">/v1/devices/search</code>
                            </div>

                            <div className="bg-[#1e1e1e] rounded-xl overflow-hidden border border-white/10">
                                <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                                    <span className="text-xs text-gray-500">Example Request</span>
                                    <button onClick={handleCopy} className="text-gray-500 hover:text-white transition-colors">
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                                <div className="p-4 overflow-x-auto">
                                    <pre className="text-sm text-blue-300 font-mono">
                                        curl https://api.crosstechconnect.com/v1/devices/search?q=ps5
                                    </pre>
                                </div>
                            </div>

                            <div className="mt-4">
                                <h4 className="font-bold mb-2 text-sm text-gray-400">Response</h4>
                                <div className="bg-[#1e1e1e] rounded-xl p-4 border border-white/10 overflow-x-auto">
                                    <pre className="text-sm text-green-300 font-mono">
                                        {`{
  "data": [
    {
      "id": "dev_12345",
      "name": "PlayStation 5",
      "brand": "Sony",
      "category": "Console",
      "specs": {
        "storage": "825GB SSD",
        "output": "HDMI 2.1"
      }
    }
  ],
  "meta": {
    "total": 1,
    "page": 1
  }
}`}
                                    </pre>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
