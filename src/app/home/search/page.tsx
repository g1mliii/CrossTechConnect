"use client";

import React, { useState } from "react";
import { Search as SearchIcon, Filter, ChevronDown } from "lucide-react";

export default function SearchPage() {
    const [query, setQuery] = useState("");

    return (
        <div className="container mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Filters */}
                <div className="w-full md:w-64 shrink-0">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sticky top-24">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold">Filters</h3>
                            <Filter className="w-4 h-4 text-gray-400" />
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h4 className="text-sm font-medium text-gray-400 mb-3">Category</h4>
                                <div className="space-y-2">
                                    {["Gaming", "Smart Home", "PC Components", "Audio", "Mobile"].map((cat) => (
                                        <label key={cat} className="flex items-center gap-2 text-sm cursor-pointer hover:text-white text-gray-400 transition-colors">
                                            <input type="checkbox" className="rounded border-gray-600 bg-black/50" />
                                            {cat}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-400 mb-3">Brand</h4>
                                <div className="space-y-2">
                                    {["Sony", "Samsung", "Logitech", "ASUS", "Apple"].map((brand) => (
                                        <label key={brand} className="flex items-center gap-2 text-sm cursor-pointer hover:text-white text-gray-400 transition-colors">
                                            <input type="checkbox" className="rounded border-gray-600 bg-black/50" />
                                            {brand}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-grow">
                    <div className="mb-8">
                        <div className="relative">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search for devices..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-lg"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-6">
                        <p className="text-gray-400">Showing 0 results</p>
                        <button className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white">
                            Sort by: Relevance <ChevronDown className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Empty State */}
                    <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl border-dashed">
                        <SearchIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">No devices found</h3>
                        <p className="text-gray-400">Try adjusting your search or filters to find what you're looking for.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
