import { useState } from 'react';
import { motion } from 'framer-motion';

const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

const YourBookings = () => {
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
            <motion.div variants={stagger} initial="hidden" animate="show">
                <motion.div variants={fadeUp}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1A1A1A' }}>Your bookings</h1>
                    <p style={{ color: '#666', marginBottom: '2rem', fontSize: '0.9rem' }}>Book a conference room in advance for 30 minutes or more.</p>
                </motion.div>

                <motion.div variants={fadeUp} style={{ display: 'flex', gap: '0.75rem', marginBottom: '3rem' }}>
                    {(['upcoming', 'past'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '0.4rem 1.25rem',
                                borderRadius: '20px',
                                border: '1px solid #ddd',
                                backgroundColor: activeTab === tab ? '#1A1A1A' : 'transparent',
                                color: activeTab === tab ? '#fff' : '#666',
                                cursor: 'pointer',
                                fontWeight: activeTab === tab ? 600 : 400,
                                fontSize: '0.875rem',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </motion.div>

                <motion.h2 variants={fadeUp} style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '3rem', color: '#333' }}>
                    You do not have any {activeTab} bookings.
                </motion.h2>

                <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '2rem' }}>
                    {/* Tree illustration — inline SVG */}
                    <svg width="260" height="220" viewBox="0 0 260 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '2rem', opacity: 0.55 }}>
                        <rect x="118" y="150" width="24" height="55" rx="4" fill="#D4B896" />
                        <ellipse cx="130" cy="205" rx="50" ry="8" fill="#E8DDD0" />
                        <ellipse cx="130" cy="158" rx="72" ry="30" fill="#7DBF82" />
                        <ellipse cx="130" cy="122" rx="56" ry="27" fill="#5CA864" />
                        <ellipse cx="130" cy="90" rx="40" ry="23" fill="#3D8C45" />
                        <circle cx="108" cy="148" r="5" fill="#A3D9A8" opacity="0.7"/>
                        <circle cx="152" cy="142" r="4" fill="#A3D9A8" opacity="0.7"/>
                        <circle cx="116" cy="108" r="4" fill="#7DBF82" opacity="0.8"/>
                        <circle cx="144" cy="112" r="3" fill="#7DBF82" opacity="0.8"/>
                    </svg>
                    <p style={{ fontSize: '1rem', color: '#888', fontWeight: 500 }}>Looking forward to your bookings</p>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default YourBookings;
