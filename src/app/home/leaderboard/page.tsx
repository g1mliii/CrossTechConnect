"use client";

import React from "react";
import { Trophy, Star, Medal, User } from "lucide-react";

const CONTRIBUTORS = [
    { rank: 1, name: "Alex Chen", points: 12500, badges: ["Bug Hunter", "Top Reviewer"], avatar: "bg-blue-500" },
    { rank: 2, name: "Sarah Jones", points: 9800, badges: ["Hardware Guru"], avatar: "bg-purple-500" },
    { rank: 3, name: "Mike Ross", points: 8400, badges: ["Documentation Wizard"], avatar: "bg-green-500" },
    { rank: 4, name: "Emily White", points: 7200, badges: ["Rising Star"], avatar: "bg-orange-500" },
    { rank: 5, name: "David Kim", points: 6500, badges: [], avatar: "bg-pink-500" },
];

export default function LeaderboardPage() {
    return (
        <div className="container mx-auto px-6 py-12">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-bold mb-4">Community Contributors</h1>
                <p className="text-gray-400 max-w-2xl mx-auto">
                    Celebrating the top members who help verify device compatibility and maintain our database.
                </p>
            </div>

            <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {/* Top 3 Cards */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center order-2 md:order-1 mt-4 md:mt-8">
                        <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mb-4 text-xl font-bold">SJ</div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl font-bold text-gray-300">#2</span>
                        </div>
                        <h3 className="text-xl font-bold mb-1">Sarah Jones</h3>
                        <p className="text-purple-400 font-medium">9,800 pts</p>
                    </div>

                    <div className="bg-gradient-to-b from-yellow-500/20 to-white/5 border border-yellow-500/30 rounded-2xl p-8 flex flex-col items-center text-center order-1 md:order-2 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-20">
                            <Trophy className="w-24 h-24 text-yellow-500" />
                        </div>
                        <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mb-4 text-2xl font-bold border-4 border-yellow-500/50">AC</div>
                        <div className="flex items-center gap-2 mb-2">
                            <Trophy className="w-5 h-5 text-yellow-500" />
                            <span className="text-3xl font-bold text-white">#1</span>
                        </div>
                        <h3 className="text-2xl font-bold mb-1">Alex Chen</h3>
                        <p className="text-yellow-400 font-bold text-lg">12,500 pts</p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center order-3 mt-4 md:mt-8">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 text-xl font-bold">MR</div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl font-bold text-gray-300">#3</span>
                        </div>
                        <h3 className="text-xl font-bold mb-1">Mike Ross</h3>
                        <p className="text-green-400 font-medium">8,400 pts</p>
                    </div>
                </div>

                {/* List View */}
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                        <h3 className="font-bold">Top 100 Contributors</h3>
                    </div>
                    <div className="divide-y divide-white/10">
                        {CONTRIBUTORS.map((user) => (
                            <div key={user.rank} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                                <span className="w-8 text-center font-bold text-gray-500">#{user.rank}</span>
                                <div className={`w-10 h-10 ${user.avatar} rounded-full flex items-center justify-center font-bold text-sm`}>
                                    {user.name.split(" ").map(n => n[0]).join("")}
                                </div>
                                <div className="flex-grow">
                                    <h4 className="font-bold">{user.name}</h4>
                                    <div className="flex gap-2 mt-1">
                                        {user.badges.map(badge => (
                                            <span key={badge} className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-gray-400">{badge}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold text-white">{user.points.toLocaleString()}</span>
                                    <span className="text-xs text-gray-500 block">points</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
