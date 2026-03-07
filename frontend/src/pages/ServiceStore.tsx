import { motion } from 'framer-motion';
import EditableField from '../components/EditableField';
import EditableImage from '../components/EditableImage';

const ServiceStore = () => {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <motion.h1
        style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '3rem', color: '#1A1A1A' }}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      >
        Service store
      </motion.h1>

      <motion.div
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '2rem' }}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
      >
        <EditableImage
          storageKey="service.illustration"
          defaultSrc="https://placehold.co/400x300/e0e0e0/808080?text=Service+Store+Illustration"
          alt="Service Store illustration"
          style={{ maxWidth: '400px', height: 'auto' }}
          wrapperStyle={{ marginBottom: '2rem' }}
        />
        <EditableField
          tag="p"
          storageKey="service.message"
          defaultValue="This page is under construction or no data is found."
          style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333' }}
        />
      </motion.div>
    </div>
  );
};

export default ServiceStore;
