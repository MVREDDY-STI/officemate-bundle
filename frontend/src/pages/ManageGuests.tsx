import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const ManageGuests = () => {
    const [date, setDate] = useState('2024-11-25');
    const [time, setTime] = useState('10:00');
    const [guests, setGuests] = useState([{ firstName: '', lastName: '', email: '' }]);

    const handleAddGuest = () => {
        setGuests([...guests, { firstName: '', lastName: '', email: '' }]);
    };

    const updateGuest = (index: number, field: string, value: string) => {
        const newGuests = [...guests];
        newGuests[index] = { ...newGuests[index], [field]: value };
        setGuests(newGuests);
    };

    const handleSave = () => {
        const filled = guests.filter(g => g.firstName || g.email);
        if (filled.length === 0) {
            toast.error('Please fill in at least one guest.');
            return;
        }
        toast.success(`${filled.length} guest${filled.length > 1 ? 's' : ''} registered successfully!`);
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
            <motion.h1
                style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', color: '#111' }}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
            >
                Guest Management
            </motion.h1>

            <motion.div
                className="grid-2col"
                variants={stagger} initial="hidden" animate="show"
            >
                {/* Left Column: Register Card */}
                <motion.div variants={fadeUp} style={{ backgroundColor: '#f8f9fa', padding: '2.5rem', borderRadius: '12px' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#111' }}>Register guests</h2>
                    <p style={{ color: '#888', marginBottom: '2rem', fontSize: '0.875rem', lineHeight: '1.5' }}>
                        Pre-register guests ahead of their visit to ensure a smooth and efficient check-in experience upon arrival.
                    </p>

                    <hr style={{ border: 'none', borderTop: '1px solid #eee', marginBottom: '2rem' }} />

                    <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#111' }}>Visit details</h3>
                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2.5rem' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <label style={{ position: 'absolute', top: '-8px', left: '12px', backgroundColor: '#f8f9fa', padding: '0 4px', fontSize: '10px', color: '#888', zIndex: 1 }}>Date</label>
                            <div style={{ display: 'flex', alignItems: 'center', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: 'transparent' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.75rem', flexShrink: 0 }}>
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', color: '#444', fontSize: '0.875rem', width: '100%' }} />
                            </div>
                        </div>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <label style={{ position: 'absolute', top: '-8px', left: '12px', backgroundColor: '#f8f9fa', padding: '0 4px', fontSize: '10px', color: '#888', zIndex: 1 }}>Time</label>
                            <div style={{ display: 'flex', alignItems: 'center', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: 'transparent' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.75rem', flexShrink: 0 }}>
                                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                                </svg>
                                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', color: '#444', fontSize: '0.875rem', width: '100%' }} />
                            </div>
                        </div>
                    </div>

                    <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#111' }}>Guest details</h3>
                    {guests.map((guest, index) => (
                        <div key={index} style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <label style={{ position: 'absolute', top: '-8px', left: '12px', backgroundColor: '#f8f9fa', padding: '0 4px', fontSize: '10px', color: '#888', zIndex: 1 }}>First Name</label>
                                    <input type="text" value={guest.firstName} onChange={(e) => updateGuest(index, 'firstName', e.target.value)} style={{ width: '100%', padding: '1rem', border: '1px solid #eee', borderRadius: '4px', backgroundColor: 'transparent', outline: 'none', boxSizing: 'border-box' }} />
                                </div>
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <label style={{ position: 'absolute', top: '-8px', left: '12px', backgroundColor: '#f8f9fa', padding: '0 4px', fontSize: '10px', color: '#888', zIndex: 1 }}>Last Name</label>
                                    <input type="text" value={guest.lastName} onChange={(e) => updateGuest(index, 'lastName', e.target.value)} style={{ width: '100%', padding: '1rem', border: '1px solid #eee', borderRadius: '4px', backgroundColor: 'transparent', outline: 'none', boxSizing: 'border-box' }} />
                                </div>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <label style={{ position: 'absolute', top: '-8px', left: '12px', backgroundColor: '#f8f9fa', padding: '0 4px', fontSize: '10px', color: '#888', zIndex: 1 }}>Email ID</label>
                                <input type="email" value={guest.email} onChange={(e) => updateGuest(index, 'email', e.target.value)} style={{ width: '100%', padding: '1rem', border: '1px solid #eee', borderRadius: '4px', backgroundColor: 'transparent', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                        </div>
                    ))}

                    <div style={{ marginBottom: '3rem' }}></div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button
                            onClick={handleAddGuest}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', backgroundColor: 'white', border: '1px solid #eee', borderRadius: '4px', color: '#888', cursor: 'pointer', fontSize: '0.875rem', transition: 'all 0.15s' }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/>
                            </svg>
                            Add another Guest
                        </button>
                        <button
                            onClick={handleSave}
                            style={{ padding: '0.75rem 2.5rem', backgroundColor: '#0066FF', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s' }}
                        >
                            Save
                        </button>
                    </div>
                </motion.div>

                {/* Right Column: Upcoming & Recent */}
                <motion.div variants={fadeUp}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem', color: '#333' }}>Upcoming</h2>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '4rem', padding: '4rem 0' }}>
                        {/* BBQ illustration — inline SVG placeholder matching reference */}
                        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '1.5rem', opacity: 0.5 }}>
                            <circle cx="60" cy="50" r="32" stroke="#ccc" strokeWidth="2" fill="none"/>
                            <line x1="60" y1="82" x2="60" y2="110" stroke="#ccc" strokeWidth="2"/>
                            <line x1="44" y1="95" x2="76" y2="95" stroke="#ccc" strokeWidth="2"/>
                            <line x1="44" y1="110" x2="60" y2="95" stroke="#ccc" strokeWidth="2"/>
                            <line x1="76" y1="110" x2="60" y2="95" stroke="#ccc" strokeWidth="2"/>
                        </svg>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111', marginBottom: '0.5rem' }}>Nothing upcoming</h3>
                        <p style={{ color: '#888', fontSize: '0.875rem' }}>You have no upcoming guest registrations</p>
                    </div>

                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#333' }}>Recent Guests</h2>
                    <hr style={{ border: 'none', borderTop: '1px solid #eee' }} />
                </motion.div>
            </motion.div>
        </div>
    );
};

export default ManageGuests;
