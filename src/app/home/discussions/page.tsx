"use client";

import React from "react";
import { MessageSquare, ThumbsUp, MessageCircle, Clock, User } from "lucide-react";

const DISCUSSIONS = [
    { id: 1, title: "Best monitor for PS5 in 2024?", author: "Gamer123", replies: 45, likes: 120, time: "2h ago", tags: ["Gaming", "Monitors"] },
    { id: 2, title: "Philips Hue sync issues with Spotify", author: "SmartHomeFan", replies: 12, likes: 8, time: "5h ago", tags: ["Smart Home", "Troubleshooting"] },
    { id: 3, title: "RTX 5090 rumors and compatibility", author: "TechInsider", replies: 89, likes: 340, time: "1d ago", tags: ["PC Components", "News"] },
    { id: 4, title: "How to link Apple HomeKit with Google Nest?", author: "IotBuilder", replies: 23, likes: 15, time: "2d ago", tags: ["IoT", "Guides"] },
];

export default function DiscussionsPage() {
    return (
        <div className="container mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Discussions</h1>
                    <p className="text-gray-400">Join the conversation with other tech enthusiasts.</p>
                </div>
                <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" /> New Discussion
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="font-bold mb-4">Categories</h3>
                        <ul className="space-y-2">
                            {["General", "Gaming Setup", "Smart Home", "PC Building", "Troubleshooting", "Showcase"].map((cat) => (
                                <li key={cat}>
                                    <a href="#" className="block py-2 px-3 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                                        {cat}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="font-bold mb-4">Trending Tags</h3>
                        <div className="flex flex-wrap gap-2">
                            {["#ps5", "#oled", "#rtx4090", "#homekit", "#matter", "#steamdeck"].map((tag) => (
                                <span key={tag} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full text-sm text-blue-400 cursor-pointer transition-colors">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Discussion List */}
                <div className="lg:col-span-3 space-y-4">
                    {DISCUSSIONS.map((discussion) => (
                        <div key={discussion.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-colors cursor-pointer group">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex gap-2 mb-2">
                                        {discussion.tags.map(tag => (
                                            <span key={tag} className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-gray-400">{tag}</span>
                                        ))}
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">{discussion.title}</h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1"><User className="w-4 h-4" /> {discussion.author}</span>
                                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {discussion.time}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2 text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <ThumbsUp className="w-4 h-4" /> {discussion.likes}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MessageCircle className="w-4 h-4" /> {discussion.replies}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
