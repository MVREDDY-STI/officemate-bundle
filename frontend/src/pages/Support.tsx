import { ChevronDown, Monitor, User } from 'lucide-react';
import { motion } from 'framer-motion';
import EditableField from '../components/EditableField';

const cardVariant = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const Support = () => {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>

      <div className="grid-2fr-1fr">
        {/* Left Column */}
        <div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <EditableField
              tag="h1"
              storageKey="support.title"
              defaultValue="Do you need support?"
              style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1A1A1A' }}
            />
            <EditableField
              tag="p"
              storageKey="support.subtitle"
              defaultValue="Select a category below to raise a ticket or visit the help desk for live chat and additional support."
              style={{ color: '#666', marginBottom: '3rem', fontSize: '0.9rem' }}
            />
          </motion.div>

          <motion.div
            className="grid-2col"
            style={{ gap: '1.5rem' }}
            variants={stagger} initial="hidden" animate="show"
          >

            {/* My Membership */}
            <motion.div variants={cardVariant} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '1.5rem', cursor: 'pointer', transition: 'box-shadow 0.2s ease' }}
              whileHover={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)', y: -2 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                <User size={22} color="#666" />
                <EditableField tag="h3" storageKey="support.cat1.title" defaultValue="My Membership" style={{ fontWeight: 'bold', fontSize: '1rem' }} />
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#555', display: 'flex', flexDirection: 'column', gap: '0.875rem', fontSize: '0.875rem' }}>
                {['Account Central', 'Billing', 'Refund', 'Member Expectations'].map((item, i) => (
                  <li key={i}>
                    <EditableField tag="span" storageKey={`support.cat1.item${i}`} defaultValue={item} />
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* IT & Audiovisuals */}
            <motion.div variants={cardVariant} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '1.5rem', cursor: 'pointer', transition: 'box-shadow 0.2s ease' }}
              whileHover={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)', y: -2 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                <EditableField tag="h3" storageKey="support.cat2.title" defaultValue="IT & Audiovisuals" style={{ fontWeight: 'bold', fontSize: '1rem' }} />
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#555', display: 'flex', flexDirection: 'column', gap: '0.875rem', fontSize: '0.875rem' }}>
                {['Printing', 'Wifi', 'Laptop', 'Extra Monitor', 'Phones'].map((item, i) => (
                  <li key={i}>
                    <EditableField tag="span" storageKey={`support.cat2.item${i}`} defaultValue={item} />
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Website & app */}
            <motion.div variants={cardVariant} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '1.5rem', cursor: 'pointer', transition: 'box-shadow 0.2s ease' }}
              whileHover={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)', y: -2 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                <Monitor size={22} color="#666" />
                <EditableField tag="h3" storageKey="support.cat3.title" defaultValue="Website & app" style={{ fontWeight: 'bold', fontSize: '1rem' }} />
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#555', display: 'flex', flexDirection: 'column', gap: '0.875rem', fontSize: '0.875rem' }}>
                {['Website & App (The Member Network)', 'Account Central', 'Services Store', 'Emails & Notifications', 'WeWork Community Guidelines'].map((item, i) => (
                  <li key={i}>
                    <EditableField tag="span" storageKey={`support.cat3.item${i}`} defaultValue={item} />
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* My Building */}
            <motion.div variants={cardVariant} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '1.5rem', cursor: 'pointer', transition: 'box-shadow 0.2s ease' }}
              whileHover={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)', y: -2 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 22V6M4 22H20M4 22H2M20 22V2M20 22H22M12 22V10M12 22H20M12 10V2M16 6H16.01M16 10H16.01M16 14H16.01M16 18H16.01M8 10H8.01M8 14H8.01M8 18H8.01M12 6H12.01"/>
                </svg>
                <EditableField tag="h3" storageKey="support.cat4.title" defaultValue="My Building" style={{ fontWeight: 'bold', fontSize: '1rem' }} />
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#555', display: 'flex', flexDirection: 'column', gap: '0.875rem', fontSize: '0.875rem' }}>
                {['Building/Facilities', 'Security', 'Office', 'Pantry', 'Account Central'].map((item, i) => (
                  <li key={i}>
                    <EditableField tag="span" storageKey={`support.cat4.item${i}`} defaultValue={item} />
                  </li>
                ))}
              </ul>
            </motion.div>

          </motion.div>
        </div>

        {/* Right Column */}
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
          <div style={{ backgroundColor: '#f8f9fa', padding: '2rem', borderRadius: '8px' }}>
            <EditableField
              tag="h3"
              storageKey="support.extra.title"
              defaultValue="For additional support"
              style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#111' }}
            />
            <EditableField
              tag="p"
              storageKey="support.extra.desc"
              defaultValue="Need additional support? Start by selecting a category below:"
              style={{ color: '#666', marginBottom: '2rem', fontSize: '0.875rem' }}
            />

            <div style={{ position: 'relative' }}>
              <label style={{ position: 'absolute', top: '-8px', left: '12px', backgroundColor: '#f8f9fa', padding: '0 4px', fontSize: '12px', color: '#888', zIndex: 1 }}>Please select a category</label>
              <select style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: 'transparent', appearance: 'none', color: '#aaa' }}>
                <option></option>
              </select>
              <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <ChevronDown size={20} color="#666" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Support;
