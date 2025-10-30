import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const SplashScreen = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000); // Show for 2 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center justify-center gap-6"
          >
            {logoError ? (
              <div className="text-center text-muted-foreground">
                <p className="text-lg">HashMatrix</p>
              </div>
            ) : (
              <>
                <img
                  src="/logo.png"
                  alt="HashMatrix Logo"
                  className="h-32 w-32 rounded-full object-cover drop-shadow-lg dark:drop-shadow-[0_0_20px_rgba(255,165,0,0.5)]"
                  style={{
                    filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))",
                  }}
                  onError={() => {
                    console.warn("Logo not found at /logo.png");
                    setLogoError(true);
                  }}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-center"
                >
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                    Offline 3D Shelf & Storage Organizer
                  </h2>
                </motion.div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

