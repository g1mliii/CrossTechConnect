"use client";

import React from "react";
import { CheckCircle, AlertTriangle, XCircle, Activity } from "lucide-react";

const SERVICES = [
    { name: "API", status: "operational", uptime: "99.99%" },
    { name: "Website", status: "operational", uptime: "100%" },
    { name: "Database", status: "operational", uptime: "99.95%" },
    { name: "Search Engine", status: "degraded", uptime: "98.50%" },
    { name: "Auth Service", status: "operational", uptime: "100%" },
];

export default function StatusPage() {
    return (
        <div className="container mx-auto px-6 py-12">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-12">
                    <h1 className="text-3xl font-bold">System Status</h1>
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-full border border-green-500/20">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-green-400 font-bold text-sm">All Systems Operational</span>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-12">
                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                        <h3 className="font-bold">Current Status</h3>
                        <span className="text-sm text-gray-500">Last updated: Just now</span>
                    </div>
                    <div className="divide-y divide-white/10">
                        {SERVICES.map((service) => (
                            <div key={service.name} className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {service.status === "operational" ? (
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                    ) : service.status === "degraded" ? (
                                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-500" />
                                    )}
                                    <span className="font-medium">{service.name}</span>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-right hidden sm:block">
                                        <span className="text-xs text-gray-500 block">Uptime (30d)</span>
                                        <span className="font-mono text-sm">{service.uptime}</span>
                                    </div>
                                    <span
                                        className={`text-sm font-bold capitalize ${service.status === "operational"
                                                ? "text-green-400"
                                                : service.status === "degraded"
                                                    ? "text-yellow-400"
                                                    : "text-red-400"
                                            }`}
                                    >
                                        {service.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="font-bold mb-6">Past Incidents</h3>
                    <div className="space-y-6">
                        <div className="relative pl-8 border-l-2 border-white/10 pb-8 last:pb-0">
                            <div className="absolute left-[-5px] top-0 w-2 h-2 bg-gray-500 rounded-full" />
                            <span className="text-sm text-gray-500 mb-1 block">Nov 22, 2024</span>
                            <h4 className="font-bold text-lg mb-2">Search Latency Spikes</h4>
                            <p className="text-gray-400 text-sm">
                                We observed increased latency in search queries due to high traffic volume. The issue has been resolved by scaling our search clusters.
                            </p>
                        </div>
                        <div className="relative pl-8 border-l-2 border-white/10 pb-8 last:pb-0">
                            <div className="absolute left-[-5px] top-0 w-2 h-2 bg-gray-500 rounded-full" />
                            <span className="text-sm text-gray-500 mb-1 block">Nov 10, 2024</span>
                            <h4 className="font-bold text-lg mb-2">Scheduled Maintenance</h4>
                            <p className="text-gray-400 text-sm">
                                Routine database maintenance was completed successfully. No downtime was observed.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
