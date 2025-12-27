"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Monitor, Gamepad2, Cpu, Smartphone, Link as LinkIcon, MoreVertical, Settings } from "lucide-react";
import Link from "next/link";

// Mock Data
const MOCK_DEVICES = [
    { id: 1, name: "PlayStation 5", category: "Console", icon: Gamepad2, color: "text-blue-400", bg: "bg-blue-500/20" },
    { id: 2, name: "LG C2 OLED", category: "Monitor", icon: Monitor, color: "text-pink-400", bg: "bg-pink-500/20" },
    { id: 3, name: "Philips Hue Bridge", category: "Smart Home", icon: Cpu, color: "text-orange-400", bg: "bg-orange-500/20" },
    { id: 4, name: "iPhone 15 Pro", category: "Mobile", icon: Smartphone, color: "text-green-400", bg: "bg-green-500/20" },
];

export default function MyDevicesPage() {
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="container mx-auto px-6 py-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-3xl font-bold mb-2">My Devices</h1>
                    <p className="text-gray-400">Manage your collection and check compatibility.</p>
                </div>
                <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Add Device
                </button>
            </div>

            {/* Compatibility Search Bar */}
            <div className="mb-12">
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                    <div className="relative flex items-center bg-black border border-white/10 rounded-2xl p-4">
                        <Search className="w-6 h-6 text-gray-400 ml-2" />
                        <input
                            type="text"
                            placeholder="Find devices compatible with your collection (e.g., 'Headsets for PS5')..."
                            className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 px-4 text-lg"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Device Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {MOCK_DEVICES.map((device) => (
                    <motion.div
                        key={device.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ y: -4 }}
                        className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-colors"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className={`w-12 h-12 ${device.bg} rounded-xl flex items-center justify-center`}>
                                <device.icon className={`w-6 h-6 ${device.color}`} />
                            </div>
                            <button className="text-gray-500 hover:text-white transition-colors">
                                <MoreVertical className="w-5 h-5" />
                            </button>
                        </div>

                        <h3 className="text-xl font-bold mb-1">{device.name}</h3>
                        <p className="text-sm text-gray-400 mb-6">{device.category}</p>

                        <div className="flex gap-2">
                            <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors">
                                Details
                            </button>
                            <button className="flex-1 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                                <LinkIcon className="w-4 h-4" /> Link
                            </button>
                        </div>
                    </motion.div>
                ))}

                {/* Add New Placeholder */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-white/20 transition-colors cursor-pointer min-h-[200px]"
                >
                    <Plus className="w-12 h-12 mb-4 opacity-50" />
                    <span className="font-medium">Add New Device</span>
                </motion.div>
            </div>

            {/* Device Linking Visualization (Placeholder) */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold">Ecosystem View</h2>
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <Settings className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="h-[300px] flex items-center justify-center relative overflow-hidden rounded-2xl bg-black/40 border border-white/5">
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                        <div className="w-[400px] h-[400px] border border-blue-500/30 rounded-full animate-[spin_10s_linear_infinite]" />
                        <div className="w-[300px] h-[300px] border border-purple-500/30 rounded-full absolute animate-[spin_15s_linear_infinite_reverse]" />
                    </div>
                    <p className="text-gray-500 relative z-10">Interactive Graph Visualization Coming Soon</p>
                </div>
            </div>
        </div>
    );
}
