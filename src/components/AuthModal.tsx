import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Mail, User, Building, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (action: 'Login' | 'Cadastro') => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isRegister) {
        if (!fullName.trim()) {
          throw new Error('Por favor, preencha o campo de Nome Completo.');
        }
        if (password.length < 6) {
          throw new Error('A senha deve conter no mínimo 6 caracteres.');
        }

        // 1. Create firebase auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Set profile display name
        await updateProfile(user, { displayName: fullName });

        // 3. Save profile document in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
          userId: user.uid,
          fullName,
          email,
          companyName: companyName || 'Não especificada',
          createdAt: new Date().toLocaleDateString('pt-BR') + ' - ' + new Date().toLocaleTimeString('pt-BR')
        });

        // 4. Record access log - Register
        const logId = Math.random().toString(36).substring(2, 9);
        const accessLogRef = doc(db, `users/${user.uid}/accesses`, logId);
        await setDoc(accessLogRef, {
          id: logId,
          action: 'Cadastro',
          timestamp: new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR'),
          userAgent: navigator.userAgent.substring(0, 150),
          status: 'Sucesso'
        });

        onSuccess('Cadastro');
        onClose();
      } else {
        // Sign In Flow
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Record access log - Login
        const logId = Math.random().toString(36).substring(2, 9);
        const accessLogRef = doc(db, `users/${user.uid}/accesses`, logId);
        await setDoc(accessLogRef, {
          id: logId,
          action: 'Login',
          timestamp: new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR'),
          userAgent: navigator.userAgent.substring(0, 150),
          status: 'Sucesso'
        });

        onSuccess('Login');
        onClose();
      }
    } catch (err: any) {
      console.error('Authentication Error:', err);
      let translateError = 'Ocorreu um erro ao processar. Verifique os dados inseridos.';
      
      if (err.code === 'auth/email-already-in-use') {
        translateError = 'Este e-mail corporativo já está associado a outra conta.';
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        translateError = 'E-mail corporativo ou senha incorretos.';
      } else if (err.code === 'auth/invalid-email') {
        translateError = 'Formato de e-mail inválido.';
      } else if (err.message) {
        translateError = err.message;
      }
      
      setError(translateError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        id="auth-modal-overlay"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          id="auth-modal-content"
        >
          {/* Header Theme Bar */}
          <div className="bg-primary text-white px-6 py-6 border-b border-outline-variant relative" id="auth-header-bar">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-full text-white/75 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              aria-label="Close auth modal"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-1">
              <span className="font-mono text-[10px] text-secondary-container font-extrabold uppercase tracking-widest block">
                Portal do Líder TI Viatix
              </span>
              <h3 className="font-sans font-bold text-xl">
                {isRegister ? 'Crie sua Conta Corporativa' : 'Acesse o Painel do Cliente'}
              </h3>
            </div>
          </div>

          {/* Form container */}
          <div className="p-6 sm:p-8" id="auth-form-body">
            <form onSubmit={handleAuth} className="space-y-4">
              {error && (
                <div 
                  className="p-3 bg-red-50 border border-red-100 text-red-800 rounded-xl flex items-start gap-2.5 text-xs font-sans leading-relaxed"
                  id="auth-error-banner"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Step registration components if isRegister */}
              <AnimatePresence mode="wait">
                {isRegister && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                    key="register-fields"
                  >
                    <div className="space-y-1">
                      <label className="block text-xs font-mono font-bold text-on-surface-variant uppercase tracking-wider">
                        Nome Completo
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                        <input
                          required={isRegister}
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Ex: Dr. Leonardo Silva"
                          className="w-full pl-10 pr-3.5 py-3 border border-outline-variant rounded-lg text-sm bg-surface focus:ring-2 focus:ring-secondary/15 focus:border-secondary outline-none transition-all font-sans"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-mono font-bold text-on-surface-variant uppercase tracking-wider">
                        Nome da Empresa (Opcional)
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="Ex: Tech Solutions Ltda"
                          className="w-full pl-10 pr-3.5 py-3 border border-outline-variant rounded-lg text-sm bg-surface focus:ring-2 focus:ring-secondary/15 focus:border-secondary outline-none transition-all font-sans"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Shared auth inputs */}
              <div className="space-y-1">
                <label className="block text-xs font-mono font-bold text-on-surface-variant uppercase tracking-wider">
                  E-mail Corporativo
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@institucional.com"
                    className="w-full pl-10 pr-3.5 py-3 border border-outline-variant rounded-lg text-sm bg-surface focus:ring-2 focus:ring-secondary/15 focus:border-secondary outline-none transition-all font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-mono font-bold text-on-surface-variant uppercase tracking-wider">
                  Senha Secreta
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-3.5 py-3 border border-outline-variant rounded-lg text-sm bg-surface focus:ring-2 focus:ring-secondary/15 focus:border-secondary outline-none transition-all font-sans"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 mt-2 bg-secondary text-on-secondary font-sans font-semibold text-sm rounded-lg hover:bg-secondary/95 transition-all shadow-md active:scale-99 cursor-pointer flex items-center justify-center gap-2"
                id="btn-auth-submit"
              >
                <span>{isLoading ? 'Autenticando...' : isRegister ? 'Criar Conta Premium' : 'Entrar no Painel'}</span>
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Selector shift */}
            <div className="mt-6 pt-4 border-t border-outline-variant text-center space-y-2">
              <p className="font-sans text-xs text-on-surface-variant">
                {isRegister ? 'Já possui cadastro corporativo?' : 'Novo por aqui?'}
              </p>
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                }}
                className="text-secondary font-sans text-xs font-bold hover:underline cursor-pointer"
                id="btn-toggle-register"
              >
                {isRegister ? 'Acessar Conta Existente' : 'Cadastrar Minha Empresa'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
