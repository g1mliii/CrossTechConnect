import React from "react";
import { Shield, Heart, MessageSquare, AlertTriangle } from "lucide-react";

export default function GuidelinesPage() {
    return (
        <div className="container mx-auto px-6 py-12">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">Community Guidelines</h1>
                    <p className="text-gray-400">
                        To keep CrossTechConnect a helpful and safe place for everyone, we ask that you follow these simple rules.
                    </p>
                </div>

                <div className="space-y-8">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex gap-6">
                        <div className="shrink-0 w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                            <Heart className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-2">Be Respectful</h3>
                            <p className="text-gray-400">
                                Treat others with respect. Harassment, hate speech, and personal attacks are strictly prohibited. We are here to learn and help each other.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex gap-6">
                        <div className="shrink-0 w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                            <Shield className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-2">Authenticity Matters</h3>
                            <p className="text-gray-400">
                                Only submit compatibility reports based on real-world experience. Do not spam or post false information. Our database relies on trust.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex gap-6">
                        <div className="shrink-0 w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                            <MessageSquare className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-2">Stay On Topic</h3>
                            <p className="text-gray-400">
                                Keep discussions relevant to device compatibility, tech setups, and related hardware/software topics.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex gap-6">
                        <div className="shrink-0 w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-2">No Illegal Content</h3>
                            <p className="text-gray-400">
                                Do not share links to pirated software, malware, or any illegal content. Such posts will be removed immediately and accounts may be banned.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-12 p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-center">
                    <p className="text-blue-200">
                        If you see something that violates these guidelines, please report it to our moderation team.
                    </p>
                </div>
            </div>
        </div>
    );
}
