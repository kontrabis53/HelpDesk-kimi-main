import { Shield, CheckCircle2, Lock } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface ChatSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatSecurityModal({ isOpen, onClose }: ChatSecurityModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[400px] p-0 overflow-hidden border-none bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl">
        <div className="relative">
          {/* Top Decorative Section */}
          <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 flex items-center justify-center relative overflow-hidden">
            {/* Animated Background Elements */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative z-10"
            >
              <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-[28px] shadow-xl flex items-center justify-center border border-white dark:border-slate-700">
                <Shield className="w-12 h-12 text-blue-600" />
              </div>
              
              {/* Floating Icons */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white dark:border-slate-900"
              >
                <Lock className="w-5 h-5" />
              </motion.div>
            </motion.div>

            {/* Background blobs */}
            <div className="absolute top-0 left-0 w-full h-full opacity-50">
              <div className="absolute top-[-10%] left-[-10%] w-40 h-40 bg-blue-200/30 dark:bg-blue-800/20 rounded-full blur-3xl" />
              <div className="absolute bottom-[-10%] right-[-10%] w-40 h-40 bg-indigo-200/30 dark:bg-indigo-800/20 rounded-full blur-3xl" />
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8 pt-6 text-center space-y-4">
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 leading-tight">
              Ваши чаты в безопасности.
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Мы используем сквозное шифрование (E2EE), как в Telegram, WhatsApp и Signal. 
              Это значит, что доступ к сообщениям есть только у вас и вашего собеседника 
              — даже мы не сможем их прочитать.
            </p>

            <div className="pt-4">
              <Button 
                onClick={onClose}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all active:scale-95"
              >
                ПОНЯТНО
                <CheckCircle2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
