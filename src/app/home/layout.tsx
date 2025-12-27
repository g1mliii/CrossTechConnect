"use client";

import React from "react";
import Link from "next/link";
import { Zap } from "lucide-react";

export default function WebsiteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-blue-500 selection:text-white font-sans overflow-x-hidden flex flex-col">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/home" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 group-hover:to-white transition-all">
                            CrossTechConnect
                        </span>
                    </Link>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
                        <Link href="/home/search" className="hover:text-white transition-colors">Search</Link>
                        <Link href="/home/my-devices" className="hover:text-white transition-colors">My Devices</Link>
                        <Link href="/home/compatibility" className="hover:text-white transition-colors">Compatibility</Link>
                        <Link href="/home/docs" className="hover:text-white transition-colors">Docs</Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/auth" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                            Log in
                        </Link>
                        <Link
                            href="/auth/register"
                            className="px-4 py-2 bg-white text-black text-sm font-bold rounded-full hover:bg-gray-200 transition-colors"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-grow pt-16">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-white/10 bg-black pt-20 pb-10">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
                        <div>
                            <h4 className="font-bold mb-6">Platform</h4>
                            <ul className="space-y-4 text-gray-400 text-sm">
                                <li><Link href="/home/search" className="hover:text-white">Search</Link></li>
                                <li><Link href="/home/compatibility" className="hover:text-white">Compatibility Checker</Link></li>
                                <li><Link href="/home/my-devices" className="hover:text-white">My Devices</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-6">Community</h4>
                            <ul className="space-y-4 text-gray-400 text-sm">
                                <li><Link href="/home/leaderboard" className="hover:text-white">Contributors</Link></li>
                                <li><Link href="/home/discussions" className="hover:text-white">Discussions</Link></li>
                                <li><Link href="/home/guidelines" className="hover:text-white">Guidelines</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-6">Resources</h4>
                            <ul className="space-y-4 text-gray-400 text-sm">
                                <li><Link href="/home/docs" className="hover:text-white">Documentation</Link></li>
                                <li><Link href="/home/api" className="hover:text-white">API</Link></li>
                                <li><Link href="/home/status" className="hover:text-white">System Status</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-6">Legal</h4>
                            <ul className="space-y-4 text-gray-400 text-sm">
                                <li><Link href="/home/legal/privacy" className="hover:text-white">Privacy Policy</Link></li>
                                <li><Link href="/home/legal/terms" className="hover:text-white">Terms of Service</Link></li>
                                <li><Link href="/home/legal/contact" className="hover:text-white">Contact Us</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10 text-gray-500 text-sm">
                        <p>© 2024 CrossTechConnect. All rights reserved.</p>
                        <div className="flex gap-6 mt-4 md:mt-0">
                            <Link href="#" className="hover:text-white">Twitter</Link>
                            <Link href="#" className="hover:text-white">GitHub</Link>
                            <Link href="#" className="hover:text-white">Discord</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
