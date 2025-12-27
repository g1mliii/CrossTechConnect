"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, CheckCircle, Cpu, Globe, ShieldCheck, ArrowRight, Layers } from "lucide-react";

export default function LandingPage() {
    return (
        <>
            {/* Hero Section */}
            <section className="relative pt-20 pb-20 md:pt-32 md:pb-32 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] -z-10" />
                <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] -z-10" />

                <div className="container mx-auto px-6 text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="will-change-transform"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-blue-400 mb-8">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            v2.0 Now Live: AI-Powered Specs
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-500">
                            Connect Everything. <br />
                            Compatible with Anything.
                        </h1>
                        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                            The universal standard for device compatibility. Verify connections between PC parts, IoT devices, and gaming gear with AI-powered precision.
                        </p>

                        {/* Search Bar */}
                        <div className="max-w-2xl mx-auto mb-12 relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                            <div className="relative flex items-center bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2">
                                <Search className="w-6 h-6 text-gray-400 ml-4" />
                                <input
                                    type="text"
                                    placeholder="Search for a device (e.g., 'PS5', 'RTX 4090', 'Philips Hue')..."
                                    className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 px-4 py-3 text-lg"
                                />
                                <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors">
                                    Search
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                            <Link
                                href="/home/compatibility"
                                className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors flex items-center gap-2"
                            >
                                Check Compatibility <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href="/home/my-devices"
                                className="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-full hover:bg-white/10 transition-colors"
                            >
                                Browse Catalog
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Grid (Bento) */}
            <section className="py-24 bg-black/50">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">Powered by Intelligence</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Our platform uses advanced AI and community verification to ensure your setup works perfectly.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Card 1: AI Extraction */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="col-span-1 md:col-span-2 p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 relative overflow-hidden group will-change-transform transform-gpu"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
                                <Cpu className="w-32 h-32" />
                            </div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6">
                                    <Cpu className="w-6 h-6 text-blue-400" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">AI-Powered Specs</h3>
                                <p className="text-gray-400 mb-6 max-w-md">
                                    We automatically extract detailed technical specifications from manuals and datasheets using schema-aware AI models.
                                </p>
                                <div className="flex gap-2">
                                    <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-mono">PDF Parsing</span>
                                    <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-mono">Schema Validation</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Card 2: Community Verified */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 relative overflow-hidden will-change-transform transform-gpu"
                        >
                            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-6">
                                <ShieldCheck className="w-6 h-6 text-green-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Community Verified</h3>
                            <p className="text-gray-400">
                                Real-world testing data from thousands of users. Trust scores you can rely on.
                            </p>
                        </motion.div>

                        {/* Card 3: Universal Compatibility */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 relative overflow-hidden will-change-transform transform-gpu"
                        >
                            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-6">
                                <Globe className="w-6 h-6 text-orange-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Universal Reach</h3>
                            <p className="text-gray-400">
                                From Gaming Consoles to Smart Fridges. If it connects, we track it.
                            </p>
                        </motion.div>

                        {/* Card 4: Interactive Demo (Placeholder) */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="col-span-1 md:col-span-2 p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 will-change-transform transform-gpu"
                        >
                            <div className="flex-1">
                                <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mb-6">
                                    <Layers className="w-6 h-6 text-pink-400" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Smart Linking</h3>
                                <p className="text-gray-400">
                                    Visualize your entire ecosystem. See how your devices interact and find the missing piece.
                                </p>
                            </div>
                            <div className="flex-1 w-full bg-black/40 rounded-xl p-4 border border-white/5">
                                {/* Mini Demo UI */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-gray-700 rounded-full" />
                                        <div className="h-2 w-20 bg-gray-700 rounded" />
                                    </div>
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-gray-700 rounded-full" />
                                        <div className="h-2 w-20 bg-gray-700 rounded" />
                                    </div>
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>
        </>
    );
}
