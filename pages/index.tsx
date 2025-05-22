import Head from 'next/head';
import type { NextPageWithLayout } from 'types';
import { useEffect, useState, ReactElement } from 'react';
import { Search, Cog, Users } from 'lucide-react'; // Import icons
import Link from 'next/link';
import { useRouter } from 'next/router';

const HomePage: NextPageWithLayout = () => {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

    useEffect(() => {
        // Set current year
        setCurrentYear(new Date().getFullYear());

        // Smooth scroll for navigation links
        const smoothScrollHandler = (e: Event) => {
            e.preventDefault();
            const targetId = (e.currentTarget as HTMLAnchorElement).getAttribute('href');
            if (targetId) {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
        };

        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', smoothScrollHandler);
        });

        // Scroll reveal animation
        const revealElements = document.querySelectorAll('.reveal');
        const revealOnScroll = () => {
            const windowHeight = window.innerHeight;
            revealElements.forEach(el => {
                const elementTop = el.getBoundingClientRect().top;
                if (elementTop < windowHeight - 50) {
                    el.classList.add('visible');
                }
            });
        };

        window.addEventListener('scroll', revealOnScroll);
        revealOnScroll(); // Trigger on load

        // Cleanup function
        return () => {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.removeEventListener('click', smoothScrollHandler);
            });
            window.removeEventListener('scroll', revealOnScroll);
        };
    }, []);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const handleMobileLinkClick = () => {
        setIsMobileMenuOpen(false); // Close menu when a link is clicked
    };

    return (
        <>
            <Head>
                <title>Nitpickr.net - AI-Powered House Hunting</title>
                <meta name="description" content="Nitpickr.net uses AI to analyze listings, spot potential issues, and helps you collaborate with friends and family to find the perfect home." />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <link rel="icon" href="/favicon.ico" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
            </Head>

            {/* Main Body Content */}
            <div className="bg-gray-50">
                {/* Navigation Bar */}
                <nav className="bg-white shadow-lg fixed w-full z-50">
                    <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                        <div className="logo-container">
                            <svg width="230" height="50" viewBox="0 0 230 50" xmlns="http://www.w3.org/2000/svg">
                                <g fill="none" stroke="#6B7280" strokeWidth="2.5">
                                    <circle cx="25" cy="25" r="10" />
                                    <line x1="32" y1="32" x2="40" y2="40" />
                                </g>
                                <text x="55" y="32" fontFamily="Montserrat, Arial, sans-serif" fontSize="18" fontWeight="800" fill="#374151">
                                    NITPICKR
                                    <tspan fill="#4B5563">.NET</tspan>
                                </text>
                            </svg>
                        </div>
                        <div className="hidden md:flex space-x-4 items-center">
                            <a href="#how-it-works" className="text-gray-600 hover:text-sky-600 transition-colors">How It Works</a>
                            <a href="#features" className="text-gray-600 hover:text-sky-600 transition-colors">Features</a>
                            <a href="#pricing" className="text-gray-600 hover:text-sky-600 transition-colors">Pricing</a>
                            <a href="#contact" className="text-gray-600 hover:text-sky-600 transition-colors">Contact</a>
                            <Link href="/nitpick/search" className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-md transition-colors font-medium">Login</Link>
                        </div>
                        <div className="md:hidden">
                            <button id="mobile-menu-button" onClick={toggleMobileMenu} className="text-gray-600 hover:text-sky-600 focus:outline-none">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                            </button>
                        </div>
                    </div>
                    {/* Mobile Menu */}
                    <div id="mobile-menu" className={`md:hidden ${isMobileMenuOpen ? '' : 'hidden'} bg-white shadow-lg`}>
                        <a href="#how-it-works" onClick={handleMobileLinkClick} className="block px-6 py-3 text-gray-600 hover:bg-sky-50 hover:text-sky-600">How It Works</a>
                        <a href="#features" onClick={handleMobileLinkClick} className="block px-6 py-3 text-gray-600 hover:bg-sky-50 hover:text-sky-600">Features</a>
                        <a href="#pricing" onClick={handleMobileLinkClick} className="block px-6 py-3 text-gray-600 hover:bg-sky-50 hover:text-sky-600">Pricing</a>
                        <a href="#contact" onClick={handleMobileLinkClick} className="block px-6 py-3 text-gray-600 hover:bg-sky-50 hover:text-sky-600">Contact</a>
                        <a href="#" onClick={handleMobileLinkClick} className="block px-6 py-3 bg-sky-500 text-white hover:bg-sky-600 text-center font-medium">Sign Up</a>
                    </div>
                </nav>

                {/* Hero Section */}
                <header className="hero-bg text-white pt-32 pb-20 md:pt-48 md:pb-32">
                    <div className="container mx-auto px-6 text-center">
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 reveal">Find Your Dream Home, Flawlessly.</h1>
                        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto reveal" style={{ transitionDelay: '0.2s' }}>
                            Nitpickr.net uses AI to analyze listings, spot potential issues, and helps you collaborate with friends and family to find the perfect home.
                        </p>
                        <div className="reveal" style={{ transitionDelay: '0.4s' }}>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    router.push(`/nitpick/search?keywords=${encodeURIComponent(searchQuery)}`);
                                }}
                            >
                                <input
                                    type="text"
                                    placeholder="Enter an address, neighborhood, city, or ZIP code"
                                    className="w-full max-w-xl p-4 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-400 mb-4 md:mb-0 md:mr-2 shadow-lg"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <button type="submit" className="cta-button">
                                    Search Listings
                                </button>
                            </form>
                        </div>
                    </div>
                </header>

                {/* How It Works Section */}
                <section id="how-it-works" className="py-16 md:py-24 bg-gray-100">
                    <div className="container mx-auto px-6">
                        <h2 className="section-title reveal text-4xl md:text-6xl font-bold mb-12 text-center">How Nitpickr Helps You</h2>
                        <div className="grid md:grid-cols-3 gap-8 text-center">
                            {/* Step 1 */}
                            <div className="reveal" style={{ transitionDelay: '0.1s' }}>
                                <div className="how-it-works-icon-bg flex justify-center items-center">
                                    <Search className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2 text-gray-700">1. Smart Search</h3>
                                <p className="text-gray-600">Easily search and compare public listings. Our AI helps you filter and find properties that match your exact needs.</p>
                            </div>
                            {/* Step 2 */}
                            <div className="reveal" style={{ transitionDelay: '0.3s' }}>
                                <div className="how-it-works-icon-bg flex justify-center items-center">
                                    <Cog className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2 text-gray-700">2. AI Issue Detection</h3>
                                <p className="text-gray-600">Our advanced AI scans listing details, photos, and descriptions to flag potential concerns you might miss.</p>
                            </div>
                            {/* Step 3 */}
                            <div className="reveal" style={{ transitionDelay: '0.5s' }}>
                                <div className="how-it-works-icon-bg flex justify-center items-center">
                                    <Users className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2 text-gray-700">3. Collaborate & Decide</h3>
                                <p className="text-gray-600">Invite friends and family to view your saved listings, add comments, and help you make the best decision together.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-16 md:py-24">
                    <div className="container mx-auto px-6">
                        <h2 className="section-title reveal text-4xl md:text-6xl font-bold mb-24 text-center">Why Choose Nitpickr.net?</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Feature 1 */}
                            <div className="feature-card reveal" style={{ transitionDelay: '0.1s' }}>
                                <img src="/ai.png"
                                    onError={(e) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src='https://placehold.co/600x400/38bdf8/ffffff?text=AI+Analysis'; }}
                                    alt="AI Analysis" className="rounded-t-lg mb-4 w-full h-48 object-cover" />
                                <h3 className="text-2xl font-semibold mb-3 text-sky-700">AI-Powered Insights</h3>
                                <p className="text-gray-600">Go beyond the surface. Our AI delves into listing data to highlight potential red flags, saving you time and future headaches. From outdated appliances to signs of poor maintenance, we spot it.</p>
                            </div>
                            {/* Feature 2 */}
                            <div className="feature-card reveal" style={{ transitionDelay: '0.3s' }}>
                                <img src="/search.png"
                                    onError={(e) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src='https://placehold.co/600x400/7dd3fc/ffffff?text=Smart+Comparison'; }}
                                    alt="Smart Comparison" className="rounded-t-lg mb-4 w-full h-48 object-cover" />
                                <h3 className="text-2xl font-semibold mb-3 text-sky-700">Intuitive Search & Compare</h3>
                                <p className="text-gray-600">No more endless tabs. Our platform allows you to easily search, filter, and compare properties side-by-side. AI assists in ranking matches based on your preferences.</p>
                            </div>
                            {/* Feature 3 */}
                            <div className="feature-card reveal" style={{ transitionDelay: '0.5s' }}>
                                <img src="/collaborative.png"
                                    onError={(e) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src='https://placehold.co/600x400/e0f2fe/1e40af?text=Team+Collaboration'; }}
                                    alt="Team Collaboration" className="rounded-t-lg mb-4 w-full h-48 object-cover" />
                                <h3 className="text-2xl font-semibold mb-3 text-sky-700">Collaborative Nitpicking</h3>
                                <p className="text-gray-600">House hunting is a team sport. Invite your partner, family, or friends to your private Nitpickr space. Share listings, gather opinions, and make decisions together, all in one place.</p>
                            </div>
                            {/* Feature 4 */}
                            <div className="feature-card reveal" style={{ transitionDelay: '0.1s' }}>
                                <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                                    onError={(e) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src='https://placehold.co/600x400/38bdf8/ffffff?text=Detailed+Reports'; }}
                                    alt="Detailed Reports" className="rounded-t-lg mb-4 w-full h-48 object-cover" />
                                <h3 className="text-2xl font-semibold mb-3 text-sky-700">Comprehensive Property Reports</h3>
                                <p className="text-gray-600">Get easy-to-understand reports for each property, summarizing potential issues, positive aspects, and areas for further inspection. Make informed offers with confidence.</p>
                            </div>
                            {/* Feature 5 */}
                            <div className="feature-card reveal" style={{ transitionDelay: '0.3s' }}>
                                <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                                    onError={(e) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src='https://placehold.co/600x400/7dd3fc/ffffff?text=Market+Trends'; }}
                                    alt="Market Trends" className="rounded-t-lg mb-4 w-full h-48 object-cover" />
                                <h3 className="text-2xl font-semibold mb-3 text-sky-700">Stay Ahead with Market Data</h3>
                                <p className="text-gray-600">Access relevant market trends and data for neighborhoods you&apos;re interested in. Understand pricing, demand, and make smarter investment choices.</p>
                            </div>
                            {/* Feature 6 */}
                            <div className="feature-card reveal" style={{ transitionDelay: '0.5s' }}>
                                <img src="/alert.png"
                                    onError={(e) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src='https://placehold.co/600x400/e0f2fe/1e40af?text=Personalized+Alerts'; }}
                                    alt="Personalized Alerts" className="rounded-t-lg mb-4 w-full h-48 object-cover" />
                                <h3 className="text-2xl font-semibold mb-3 text-sky-700">Personalized Listing Alerts</h3>
                                <p className="text-gray-600">Never miss a new listing that fits your criteria. Set up personalized alerts and get notified instantly when matching properties hit the market or have status changes.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section id="testimonials" className="py-16 md:py-24 bg-sky-50">
                    <div className="container mx-auto px-6">
                        <h2 className="section-title reveal text-4xl md:text-6xl font-bold mb-24 text-center">Loved by Home Buyers</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Testimonial 1 */}
                            <div className="bg-white p-6 rounded-xl shadow-lg reveal hover:shadow-xl transition-shadow" style={{ transitionDelay: '0.1s' }}>
                                <p className="text-gray-600 mb-4">&quot;Nitpickr.net found a hidden water damage sign in a listing photo that we totally missed! Saved us from a potential disaster. Highly recommend!&quot;</p>
                                <p className="font-semibold text-sky-600">- Sarah & Tom L.</p>
                            </div>
                            {/* Testimonial 2 */}
                            <div className="bg-white p-6 rounded-xl shadow-lg reveal hover:shadow-xl transition-shadow" style={{ transitionDelay: '0.3s' }}>
                                <p className="text-gray-600 mb-4">&quot;The collaborative feature was a game-changer. My parents and I could easily share notes on properties. Made the whole process so much smoother.&quot;</p>
                                <p className="font-semibold text-sky-600">- Michael B.</p>
                            </div>
                            {/* Testimonial 3 */}
                            <div className="bg-white p-6 rounded-xl shadow-lg reveal hover:shadow-xl transition-shadow" style={{ transitionDelay: '0.5s' }}>
                                <p className="text-gray-600 mb-4">&quot;I love how the AI helps compare listings. It pointed out subtle differences in value that weren&apos;t obvious at first glance. Found my perfect condo thanks to Nitpickr!&quot;</p>
                                <p className="font-semibold text-sky-600">- Priya K.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pricing Section */}
                <section id="pricing" className="py-16 md:py-24">
                    <div className="container mx-auto px-6">
                        <h2 className="section-title reveal text-4xl md:text-6xl font-bold mb-24 text-center">Simple, Transparent Pricing</h2>
                        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                            {/* Plan 1: Basic */}
                            <div className="border border-gray-200 rounded-xl p-8 text-center shadow-lg hover:shadow-2xl transition-shadow duration-300 reveal" style={{ transitionDelay: '0.1s' }}>
                                <h3 className="text-2xl font-semibold mb-2 text-gray-700">Basic</h3>
                                <p className="text-5xl font-bold text-sky-600 mb-4">$0<span className="text-lg font-normal text-gray-500">/month</span></p>
                                <ul className="text-gray-600 space-y-2 mb-6 text-left">
                                    <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7"></path></svg>Limited AI Analysis (5 listings/month)</li>
                                    <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7"></path></svg>Basic Search & Compare</li>
                                    <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7"></path></svg>Collaborate with 1 Friend</li>
                                    <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7"></path></svg>Email Support</li>
                                </ul>
                                <button className="secondary-cta-button">Get Started</button>
                            </div>
                            {/* Plan 2: Pro (Most Popular) */}
                            <div className="border-2 border-sky-500 rounded-xl p-8 text-center shadow-2xl relative reveal" style={{ transitionDelay: '0.3s' }}>
                                <span className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-sky-500 text-white px-3 py-1 text-sm font-semibold rounded-full">Most Popular</span>
                                <h3 className="text-2xl font-semibold mb-2 text-gray-700">Pro</h3>
                                <p className="text-5xl font-bold text-sky-600 mb-4">$29<span className="text-lg font-normal text-gray-500">/month</span></p>
                                <ul className="text-gray-600 space-y-2 mb-6 text-left">
                                    <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7"></path></svg>Unlimited AI Analysis</li>
                                    <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7"></path></svg>Advanced Search & Compare</li>
                                    <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7"></path></svg>Collaborate with up to 5 People</li>
                                    <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7"></path></svg>Priority Email Support</li>
                                    <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7"></path></svg>Detailed Property Reports</li>
                                </ul>
                                <button className="w-full cta-button">Choose Pro</button>
                            </div>
                            {/* Plan 3: Premium */}
                            <div className="border border-gray-200 rounded-xl p-8 text-center shadow-lg hover:shadow-2xl transition-shadow duration-300 reveal" style={{ transitionDelay: '0.5s' }}>
                                <h3 className="text-2xl font-semibold mb-2 text-gray-700">Premium</h3>
                                <p className="text-5xl font-bold text-sky-600 mb-4">$49<span className="text-lg font-normal text-gray-500">/month</span></p>
                                <ul className="text-gray-600 space-y-2 mb-6 text-left">
                                    <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7"></path></svg>All Pro Features</li>
                                    <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7"></path></svg>Collaborate with Unlimited People</li>
                                    <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7"></path></svg>Market Trend Insights</li>
                                    <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7"></path></svg>Phone & Chat Support</li>
                                </ul>
                                <button className="secondary-cta-button">Choose Premium</button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Call to Action Section */}
                <section id="cta" className="py-16 md:py-24 bg-sky-600 text-white">
                    <div className="container mx-auto px-6 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 reveal">Ready to Find Your Next Home with Confidence?</h2>
                        <p className="text-lg md:text-xl mb-8 max-w-xl mx-auto reveal" style={{ transitionDelay: '0.2s' }}>
                            Join Nitpickr.net today and experience a smarter, more collaborative way to hunt for houses.
                        </p>
                        <div className="reveal" style={{ transitionDelay: '0.4s' }}>
                            <button   
                                onClick={() => router.push('/login')}
                                className="px-10 py-4 bg-white text-sky-600 font-bold rounded-lg shadow-lg hover:bg-gray-100 hover:scale-105 transform transition-all duration-300 ease-in-out text-xl">
                            Sign Up for Free
                            </button>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer id="contact" className="bg-gray-800 text-gray-300 py-12">
                    <div className="container mx-auto px-6">
                        <div className="grid md:grid-cols-3 gap-8 mb-8">
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-3">nitpickr.net</h3>
                                <p className="text-sm">AI-powered house hunting, made simple and collaborative.</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3">Quick Links</h3>
                                <ul className="space-y-2 text-sm">
                                    <li><a href="#how-it-works" className="hover:text-sky-400 transition-colors">How It Works</a></li>
                                    <li><a href="#features" className="hover:text-sky-400 transition-colors">Features</a></li>
                                    <li><a href="#pricing" className="hover:text-sky-400 transition-colors">Pricing</a></li>
                                    <li><a href="#" className="hover:text-sky-400 transition-colors">Privacy Policy</a></li>
                                    <li><a href="#" className="hover:text-sky-400 transition-colors">Terms of Service</a></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3">Contact Us</h3>
                                <p className="text-sm">Email: support@nitpickr.net</p>
                                <p className="text-sm">Phone: (555) 123-4567 (Placeholder)</p>
                                <div className="mt-4 flex space-x-4">
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg></a>
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg></a>
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.737 9.499.5.092.682-.218.682-.484 0-.238-.009-.868-.014-1.704-2.782.604-3.369-1.342-3.369-1.342-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.074 1.532 1.029 1.532 1.029.891 1.529 2.341 1.087 2.91.831.091-.646.349-1.086.635-1.337-2.22-.252-4.555-1.112-4.555-4.943 0-1.091.39-1.984 1.029-2.685-.103-.254-.447-1.272.098-2.647 0 0 .84-.269 2.75 1.025A9.548 9.548 0 0112 6.836c.85.003 1.702.115 2.504.336 1.909-1.294 2.748-1.025 2.748-1.025.547 1.375.203 2.393.1 2.647.64.701 1.027 1.594 1.027 2.685 0 3.841-2.337 4.687-4.565 4.935.358.309.679.921.679 1.852 0 1.336-.012 2.415-.012 2.741 0 .269.18.579.688.481A10.004 10.004 0 0022 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" /></svg></a>
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-gray-700 pt-8 text-center text-sm">
                            <p>&copy; {currentYear} Nitpickr.net. All rights reserved. Designed with AI, built for you.</p>
                        </div>
                    </div>
                </footer>
            </div>

            <style jsx global>{`
                body {
                    font-family: 'Inter', sans-serif;
                    scroll-behavior: smooth;
                }
                .hero-bg {
                    background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('/house_c.png');
                    background-size: cover;
                    background-position: center;
                }
                // .hero-bg {
                //     background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80');
                //     background-size: cover;
                //     background-position: center;
                // }
                .reveal {
                    opacity: 0;
                    transform: translateY(30px);
                    transition: opacity 0.8s ease-out, transform 0.8s ease-out;
                }
                .reveal.visible {
                    opacity: 1;
                    transform: translateY(0);
                }
            `}</style>
        </>
    );
};

HomePage.getLayout = function getLayout(page: ReactElement) {
    return <>{page}</>;
};

export default HomePage;
