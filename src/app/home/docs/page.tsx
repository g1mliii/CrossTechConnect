"use client";

import React from "react";
import { Book, Code, Terminal, Search, ChevronRight } from "lucide-react";

export default function DocsPage() {
    return (
        <div className="container mx-auto px-6 py-12">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-bold mb-4">Documentation</h1>
                <p className="text-gray-400 max-w-2xl mx-auto">
                    Everything you need to know about integrating with CrossTechConnect and using our platform.
                </p>

                <div className="max-w-xl mx-auto mt-8 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search documentation..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/[0.07] transition-colors cursor-pointer group">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6">
                        <Book className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">Getting Started</h3>
                    <p className="text-gray-400 mb-4">
                        Learn the basics of CrossTechConnect, from account creation to your first compatibility check.
                    </p>
                    <span className="text-blue-400 text-sm font-bold flex items-center gap-1">Read Guide <ChevronRight className="w-4 h-4" /></span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/[0.07] transition-colors cursor-pointer group">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6">
                        <Code className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-purple-400 transition-colors">Integration Guide</h3>
                    <p className="text-gray-400 mb-4">
                        Connect your applications with our device database using our robust API and SDKs.
                    </p>
                    <span className="text-purple-400 text-sm font-bold flex items-center gap-1">View Docs <ChevronRight className="w-4 h-4" /></span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/[0.07] transition-colors cursor-pointer group">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-6">
                        <Terminal className="w-6 h-6 text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-green-400 transition-colors">API Reference</h3>
                    <p className="text-gray-400 mb-4">
                        Detailed endpoints, parameters, and response examples for developers.
                    </p>
                    <span className="text-green-400 text-sm font-bold flex items-center gap-1">Explore API <ChevronRight className="w-4 h-4" /></span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                    <h2 className="text-2xl font-bold mb-6">Popular Topics</h2>
                    <ul className="space-y-3">
                        {["How to verify device compatibility", "Understanding Trust Scores", "Linking your Steam account", "Reporting incorrect data", "API Rate Limits"].map((topic) => (
                            <li key={topic}>
                                <a href="#" className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group">
                                    <span className="text-gray-300 group-hover:text-white">{topic}</span>
                                    <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white" />
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h2 className="text-2xl font-bold mb-6">Latest Updates</h2>
                    <div className="space-y-6">
                        <div className="border-l-2 border-blue-500 pl-6">
                            <span className="text-sm text-blue-400 font-bold">Nov 24, 2024</span>
                            <h3 className="text-lg font-bold mt-1">API v2.1 Released</h3>
                            <p className="text-gray-400 text-sm mt-1">Added support for Matter protocol devices and improved search latency.</p>
                        </div>
                        <div className="border-l-2 border-white/10 pl-6">
                            <span className="text-sm text-gray-500 font-bold">Nov 15, 2024</span>
                            <h3 className="text-lg font-bold mt-1">New Dashboard UI</h3>
                            <p className="text-gray-400 text-sm mt-1">Completely redesigned user dashboard with drag-and-drop device management.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
