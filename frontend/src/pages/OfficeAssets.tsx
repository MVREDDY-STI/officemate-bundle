import { Monitor, Smartphone, Tag, Tv, Wifi } from 'lucide-react';
import { motion } from 'framer-motion';
import EditableField from '../components/EditableField';

const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

const OfficeAssets = () => {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <motion.h1
        style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '3rem', color: '#1A1A1A' }}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      >
        Office Assets List
      </motion.h1>

      <div className="grid-2fr-1fr">
        {/* Left Column: Request Form */}
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.div variants={fadeUp}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#111' }}>Create a request</h2>
            <form style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              <div style={{ display: 'flex', gap: '2rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <label style={{ position: 'absolute', top: '-8px', left: '12px', backgroundColor: '#fff', padding: '0 4px', fontSize: '12px', color: '#888' }}>Device Name</label>
                  <input type="text" style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                  <label style={{ position: 'absolute', top: '-8px', left: '12px', backgroundColor: '#fff', padding: '0 4px', fontSize: '12px', color: '#888' }}>Device Model</label>
                  <input type="text" style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box', outline: 'none' }} />
                </div>
              </div>
              <div style={{ position: 'relative' }}>
                <label style={{ position: 'absolute', top: '-8px', left: '12px', backgroundColor: '#fff', padding: '0 4px', fontSize: '12px', color: '#888' }}>Purpose of requesting</label>
                <input type="text" style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box', height: '80px', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <label style={{ position: 'absolute', top: '-8px', left: '12px', backgroundColor: '#fff', padding: '0 4px', fontSize: '12px', color: '#888' }}>Prime Approval</label>
                  <input type="text" style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                  <div style={{ color: '#ccc', fontSize: '14px', cursor: 'not-allowed' }}>Submit</div>
                </div>
              </div>
            </form>
          </motion.div>

          {/* Device icons */}
          <motion.div variants={fadeUp} style={{ display: 'flex', gap: '1.5rem', marginTop: '4rem', overflowX: 'auto', paddingBottom: '1rem' }}>
            {[
              { icon: Monitor, name: 'Laptop', sn: 'SN : 0099887703' },
              { icon: Smartphone, name: 'Mobile', sn: 'SN : 0099887703' },
              { icon: Tag, name: 'ESL Tag', sn: 'SN : 0099887703' },
              { icon: Monitor, name: 'Monitor', sn: 'SN : 0099887703' },
              { icon: Tv, name: 'TV', sn: 'SN : 0099887703' },
              { icon: Wifi, name: 'Gateway', sn: 'SN : 0099887703' },
            ].map((item, idx) => (
              <div key={idx} style={{ textAlign: 'center', minWidth: '110px' }}>
                <div style={{ width: '72px', height: '72px', margin: '0 auto 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #eee', borderRadius: '12px', padding: '1rem' }}>
                  <item.icon size={36} color="#666" strokeWidth={1} />
                </div>
                <div style={{ fontWeight: 500, marginBottom: '0.2rem', fontSize: '0.875rem' }}>{item.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#888' }}>{item.sn}</div>
              </div>
            ))}
          </motion.div>

          {/* Guidelines */}
          <motion.div variants={fadeUp} style={{ marginTop: '4rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#333' }}>Your Guidelines</h2>
            <ul style={{ listStyleType: 'none', padding: 0, color: '#444', lineHeight: '1.7', fontSize: '0.9rem' }}>
              <li style={{ marginBottom: '1rem' }}>
                <strong>1. Record Serial Numbers : </strong>
                <EditableField tag="span" storageKey="assets.guideline.1" defaultValue="Ensure that the serial numbers of all company belongings (e.g., monitors, laptops, mobile devices, and other electronic items) are properly noted." />
              </li>
              <li style={{ marginBottom: '1rem' }}>
                <strong>2. Handle with Care : </strong>
                <EditableField tag="span" storageKey="assets.guideline.2" defaultValue="Safely store and maintain all equipment to prevent damage or loss." />
              </li>
              <li style={{ marginBottom: '1rem' }}>
                <strong>3. Device Changes or Repairs : </strong>
                <EditableField tag="span" storageKey="assets.guideline.3" defaultValue="If you need to replace or service a device, kindly follow the necessary procedures and submit a formal request." />
              </li>
              <li style={{ marginBottom: '1rem' }}>
                <strong>4. Report Issues : </strong>
                <EditableField tag="span" storageKey="assets.guideline.4" defaultValue="For non-working, damaged, or malfunctioning items, notify the relevant team promptly by submitting a request here." />
              </li>
              <li>
                <strong>5. Request Process : </strong>
                <EditableField tag="span" storageKey="assets.guideline.5" defaultValue="Use the designated platform or form to raise any requirements or concerns about company equipment." />
              </li>
            </ul>
          </motion.div>
        </motion.div>

        {/* Right Column: Support */}
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
          <div style={{ backgroundColor: '#f8f9fa', padding: '2rem', borderRadius: '8px' }}>
            <EditableField
              tag="h3"
              storageKey="assets.support.title"
              defaultValue="For any further queries"
              style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#111' }}
            />
            <EditableField
              tag="p"
              storageKey="assets.support.desc"
              defaultValue="Need additional support? Start by selecting a category below:"
              style={{ color: '#666', marginBottom: '2rem', fontSize: '0.875rem' }}
            />

            <div style={{ position: 'relative' }}>
              <select style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: 'white', appearance: 'none', color: '#aaa' }}>
                <option>Please select a category</option>
              </select>
              <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1.5L6 6.5L11 1.5" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OfficeAssets;
