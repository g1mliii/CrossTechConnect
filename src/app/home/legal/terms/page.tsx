import React from "react";

export default function TermsPage() {
    return (
        <div className="container mx-auto px-6 py-20">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
                <div className="space-y-6 text-gray-300">
                    <p>Last updated: November 24, 2024</p>
                    <p>
                        Please read these Terms of Service carefully before using the CrossTechConnect platform.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-8">1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using our service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the service.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-8">2. User Accounts</h2>
                    <p>
                        When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-8">3. Content</h2>
                    <p>
                        Our service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material. You are responsible for the content that you post.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-8">4. Termination</h2>
                    <p>
                        We may terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                    </p>
                </div>
            </div>
        </div>
    );
}
