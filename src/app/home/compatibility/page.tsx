"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, CheckCircle, XCircle, AlertTriangle, ArrowRight } from "lucide-react";

export default function CompatibilityPage() {
    const [deviceA, setDeviceA] = useState("");
    const [deviceB, setDeviceB] = useState("");
    const [result, setResult] = useState<null | "compatible" | "incompatible" | "warning">(null);

    const handleCheck = () => {
        // Mock logic for demonstration
        if (deviceA && deviceB) {
            const random = Math.random();
            if (random > 0.6) setResult("compatible");
            else if (random > 0.3) setResult("warning");
            else setResult("incompatible");
        }
    };

    return (
        <div className="container mx-auto px-6 py-12">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-bold mb-4">Compatibility Checker</h1>
                <p className="text-gray-400 max-w-2xl mx-auto">
                    Verify if two devices will work together using our AI-powered analysis engine.
                </p>
            </div>

            <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 relative">
                    {/* Device A Input */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                        <label className="block text-sm font-medium text-gray-400 mb-4">Device 1</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                placeholder="e.g., PlayStation 5"
                                className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={deviceA}
                                onChange={(e) => setDeviceA(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Connector Icon (Absolute Centered) */}
                    <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600 rounded-full items-center justify-center z-10 border-4 border-black">
                        <ArrowRight className="w-6 h-6 text-white" />
                    </div>

                    {/* Device B Input */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                        <label className="block text-sm font-medium text-gray-400 mb-4">Device 2</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                placeholder="e.g., Sony Pulse 3D Headset"
                                className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={deviceB}
                                onChange={(e) => setDeviceB(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="text-center mb-12">
                    <button
                        onClick={handleCheck}
                        disabled={!deviceA || !deviceB}
                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Analyze Compatibility
                    </button>
                </div>

                {/* Results Section */}
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-3xl p-8 border ${result === "compatible"
                                ? "bg-green-500/10 border-green-500/20"
                                : result === "warning"
                                    ? "bg-yellow-500/10 border-yellow-500/20"
                                    : "bg-red-500/10 border-red-500/20"
                            }`}
                    >
                        <div className="flex items-start gap-6">
                            <div
                                className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${result === "compatible"
                                        ? "bg-green-500/20 text-green-400"
                                        : result === "warning"
                                            ? "bg-yellow-500/20 text-yellow-400"
                                            : "bg-red-500/20 text-red-400"
                                    }`}
                            >
                                {result === "compatible" ? (
                                    <CheckCircle className="w-8 h-8" />
                                ) : result === "warning" ? (
                                    <AlertTriangle className="w-8 h-8" />
                                ) : (
                                    <XCircle className="w-8 h-8" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold mb-2 capitalize">{result} Match</h3>
                                <p className="text-gray-300 mb-4">
                                    {result === "compatible"
                                        ? "These devices are fully compatible. All major features should work as expected."
                                        : result === "warning"
                                            ? "These devices may work together, but some features might be limited or require adapters."
                                            : "These devices are likely incompatible. Connection protocols do not match."}
                                </p>
                                <div className="bg-black/20 rounded-xl p-4">
                                    <h4 className="text-sm font-bold text-gray-400 mb-2">AI Analysis</h4>
                                    <p className="text-sm text-gray-500">
                                        Based on technical specifications, {deviceA} uses Bluetooth 5.1 while {deviceB} supports...
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
