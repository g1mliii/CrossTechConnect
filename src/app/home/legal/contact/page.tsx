import React from "react";
import { Mail, MessageSquare, Phone } from "lucide-react";

export default function ContactPage() {
    return (
        <div className="container mx-auto px-6 py-20">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-8 text-center">Contact Us</h1>
                <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
                    Have questions about device compatibility? Need help with your account? We're here to help.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                            <Mail className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Email Support</h3>
                        <p className="text-gray-400 mb-4">For general inquiries and account support.</p>
                        <a href="mailto:support@crosstechconnect.com" className="text-blue-400 hover:text-blue-300 font-medium">support@crosstechconnect.com</a>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
                            <MessageSquare className="w-6 h-6 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Community Forum</h3>
                        <p className="text-gray-400 mb-4">Get help from the community and experts.</p>
                        <a href="/discussions" className="text-purple-400 hover:text-purple-300 font-medium">Visit Forums</a>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                            <Phone className="w-6 h-6 text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Business Inquiries</h3>
                        <p className="text-gray-400 mb-4">For partnerships and enterprise solutions.</p>
                        <a href="mailto:business@crosstechconnect.com" className="text-green-400 hover:text-green-300 font-medium">business@crosstechconnect.com</a>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
                    <form className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                                <input type="text" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Your name" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                                <input type="email" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="your@email.com" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Subject</label>
                            <input type="text" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="How can we help?" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Message</label>
                            <textarea rows={4} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Tell us more..." />
                        </div>
                        <button type="button" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-colors">
                            Send Message
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
