import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Zap } from 'lucide-react';

// Types & Config
import { supabase } from './services/supabase';

// Hooks
import { useTenants } from './hooks/useTenants';
import { useCustomers } from './hooks/useCustomers';
import { useOrders } from './hooks/useOrders';

// Components
import { Sidebar } from './components/Sidebar';
import { WorkflowView } from './components/WorkflowView';
import { LoginView } from './components/LoginView';
import { CalendarioView } from './components/CalendarioView';
import { ConversationsView } from './components/ConversationsView';
import { LeadsView } from './components/LeadsView';
import { SupportChatView } from './components/SupportChatView';
import { UsageMetricsView } from './components/UsageMetricsView';
import ROIMetricsView from './components/ROIMetricsView';
import { GlobalDashboard } from './components/GlobalDashboard';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { CustomersView } from './components/CustomersView';
import { OrderHistoryView } from './components/OrderHistoryView';
import { ConfigView } from './components/ConfigView';
import { AdminTenantsView } from './components/AdminTenantsView';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userName, setUserName] = useState<string>('Usuario');
  const [userEmail, setUserEmail] = useState<string>('...');
  const { tenants: supabaseTenants, refreshTenants } = useTenants();
  const [currentTenantId, setCurrentTenantId] = useState<string>(() => {
    return localStorage.getItem('chatbot_last_tenant_id') || 'ia-agus';
  });

  const [activeView, setActiveView] = useState<'dashboard' | 'auditoria' | 'pedidos' | 'clientes' | 'leads' | 'workflows' | 'calendario' | 'knowledge' | 'soporte' | 'configuracion' | 'uso' | 'roi' | 'admin_tenants'>(() => {
    return (localStorage.getItem('chatbot_last_view') as any) || 'dashboard';
  });
  const [lang, setLang] = useState<'es' | 'en'>('es');

  // Navigation State
  const [selectedChatPhone, setSelectedChatPhone] = useState<string | null>(null);
  const [selectedChatMessage, setSelectedChatMessage] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // --- DATA HOOKS ---
  const { customers } = useCustomers(currentTenantId);
  const { orders, updateOrderStatus } = useOrders(currentTenantId);

  // Sync current tenant
  const currentTenant = supabaseTenants.find(t => t.id === currentTenantId) || supabaseTenants[0];
  const activeColor = currentTenant?.primaryColor || 'bg-indigo-600';

  // Persist tenant choice
  useEffect(() => {
    if (currentTenantId) {
      localStorage.setItem('chatbot_last_tenant_id', currentTenantId);
    }
  }, [currentTenantId]);

  // Persist view choice
  useEffect(() => {
    localStorage.setItem('chatbot_last_view', activeView);
  }, [activeView]);

  // Force default Tenant for Agus ONLY on login (not on every tenant change)
  useEffect(() => {
    if (isAuthenticated && ['agus@ia-agus.com', 'agusstinph@gmail.com', 'admin@ia-agus.com'].includes(userEmail.toLowerCase())) {
      const savedTenant = localStorage.getItem('chatbot_last_tenant');
      if (!savedTenant || (savedTenant !== 'ia-agus' && ['ia-agus', 'chatbot-ia-pro', 'ia-agus-chatbot', 'chatbot-demo'].includes(savedTenant))) {
        // Only force if no saved tenant or if an old/incorrect ID is saved
        setCurrentTenantId('ia-agus');
        localStorage.setItem('chatbot_last_tenant', 'ia-agus');
        console.log("🔄 Admin login: defaulting to ia-agus");
      }
    }
  }, [isAuthenticated, userEmail]); // NOTE: currentTenantId intentionally NOT here - avoids lock

  // Auth Change Listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        setIsAuthenticated(true);
        const email = session.user.email?.toLowerCase() || '';

        // Dynamic User Info
        setUserEmail(email);
        setUserName(session.user.user_metadata?.name || email.split('@')[0] || 'Usuario');

        // SuperAdmin Check
        const admins = ['agus@ia-agus.com', 'agusstinph@gmail.com', 'admin@ia-agus.com'];
        const isAdmin = admins.includes(email);
        setIsSuperAdmin(isAdmin);

        // Ensure we fetch tenant configs explicitly with the new session
        refreshTenants();

        // Fetch user roles to find their tenant(s)
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('tenant_id, role')
          .eq('user_id', session.user.id);

        const hasSuperAdminRole = rolesData?.some(r => r.role === 'superadmin');
        if (hasSuperAdminRole) setIsSuperAdmin(true);

        if (rolesData && rolesData.length > 0) {
          // If they have multiple roles, we pick the first one unless one is already selected
          const savedTenant = localStorage.getItem('chatbot_last_tenant_id');
          const hasAccessToSaved = rolesData.some(r => r.tenant_id === savedTenant);

          if (!savedTenant || !hasAccessToSaved) {
            setCurrentTenantId(rolesData[0].tenant_id);
          }
        }

        // Restore last view from localStorage, or default to dashboard
        let lastView = localStorage.getItem('chatbot_last_view') as typeof activeView;
        if (!isAdmin && lastView === 'dashboard') {
          lastView = 'auditoria';
        }
        setActiveView(lastView || (isAdmin ? 'dashboard' : 'auditoria'));
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setIsSuperAdmin(false);
        setActiveView('dashboard');
      }
    });
    return () => subscription.unsubscribe();
  }, [activeView, refreshTenants]);

  const handleLogout = async () => {
    console.log("🟢 Logout button clicked!");
    try {
      // 1. Clear local session from Supabase client (Non-blocking)
      supabase.auth.signOut().catch(err => console.error("Background signOut error:", err));

      // 2. Clear application state (Immediate UI update)
      setIsAuthenticated(false);
      setIsSuperAdmin(false);
      localStorage.clear(); // Nuclear option to ensure no remnants stay

      console.log("🟢 Session cleared. Redirecting...");

      // 3. Forced hard-reload to clean memory and return to '/'
      window.location.replace('/');
    } catch (err) {
      console.error("🟢 Logout exception:", err);
      window.location.href = '/';
    }
  };

  const handleTenantSave = async (updates: any) => {
    if (!currentTenantId) return;
    try {
      // PRO MAPPING: Translate camelCase from UI to snake_case for DB
      const dbUpdates: any = { ...updates };

      if (updates.systemInstruction !== undefined) {
        dbUpdates.system_instruction = updates.systemInstruction;
        delete dbUpdates.systemInstruction;
      }
      if (updates.websiteUrl !== undefined) {
        dbUpdates.website_url = updates.websiteUrl;
        delete dbUpdates.websiteUrl;
      }
      if (updates.agentName !== undefined) {
        dbUpdates.agent_name = updates.agentName;
        delete dbUpdates.agentName;
      }
      if (updates.activeModality !== undefined) {
        dbUpdates.active_modality = updates.activeModality;
        delete dbUpdates.activeModality;
      }
      if (updates.agentVoice !== undefined) {
        dbUpdates.agent_voice = updates.agentVoice;
        delete dbUpdates.agentVoice;
      }
      if (updates.primaryColor !== undefined) {
        dbUpdates.primary_color = updates.primaryColor;
        delete dbUpdates.primaryColor;
      }
      if (updates.evolutionApiUrl !== undefined) {
        dbUpdates.evolution_api_url = updates.evolutionApiUrl;
        delete dbUpdates.evolutionApiUrl;
      }
      if (updates.evolutionApiKey !== undefined) {
        dbUpdates.evolution_api_key = updates.evolutionApiKey;
        delete dbUpdates.evolutionApiKey;
      }
      if (updates.evolutionInstance !== undefined) {
        dbUpdates.evolution_instance = updates.evolutionInstance;
        delete dbUpdates.evolutionInstance;
      }
      if (updates.telegramBotToken !== undefined) {
        dbUpdates.telegram_bot_token = updates.telegramBotToken;
        delete dbUpdates.telegramBotToken;
      }
      if (updates.telegramChatId !== undefined) {
        dbUpdates.telegram_chat_id = updates.telegramChatId;
        delete dbUpdates.telegramChatId;
      }
      if (updates.callProviderUrl !== undefined) {
        dbUpdates.call_provider_url = updates.callProviderUrl;
        delete dbUpdates.callProviderUrl;
      }
      if (updates.callProviderApiKey !== undefined) {
        dbUpdates.call_provider_api_key = updates.callProviderApiKey;
        delete dbUpdates.callProviderApiKey;
      }
      if (updates.crmType !== undefined) {
        dbUpdates.crm_type = updates.crmType;
        delete dbUpdates.crmType;
      }
      if (updates.crmApiKey !== undefined) {
        dbUpdates.crm_api_key = updates.crmApiKey;
        delete dbUpdates.crmApiKey;
      }
      if (updates.crmEndpoint !== undefined) {
        dbUpdates.crm_endpoint = updates.crmEndpoint;
        delete dbUpdates.crmEndpoint;
      }


      const { error } = await supabase.from('tenant_configs').update(dbUpdates).eq('id', currentTenantId);

      if (error) throw error;
      console.log(`✅ Tenant "${currentTenantId}" updated successfully`);
      // Fire-and-forget refresh — don't await so a slow Realtime channel never blocks the UI
      refreshTenants().catch(e => console.warn('⚠️ refreshTenants silently failed:', e));
    } catch (err: any) {
      console.error('❌ Error updating tenant:', err);
      alert('Error al guardar cambios: ' + err.message);
    }
  };


  // --- RENDER VIEWS ---
  const renderContent = () => {
    switch (activeView) {
      case 'calendario':
        return (
          <CalendarioView
            tenantId={currentTenantId}
            activeColor={activeColor}
            customers={customers}
            onOpenChat={(phone, initialMessage) => {
              if (phone) {
                const cleanedPhone = phone.replace(/\D/g, '');
                setSelectedChatPhone(cleanedPhone);
                if (initialMessage) {
                  setSelectedChatMessage(initialMessage);
                }
                setActiveView('auditoria');
              }
            }}
          />
        );
      case 'clientes':
        return (
          <CustomersView
            tenantId={currentTenantId}
            activeColor={activeColor}
            onChat={(customer) => {
              if (customer.phone) {
                const cleanedPhone = customer.phone.replace(/\D/g, '');
                setSelectedChatPhone(cleanedPhone);
                setActiveView('auditoria');
              }
            }}
          />
        );
      case 'auditoria':
        return (
          <ConversationsView
            tenantId={currentTenantId}
            initialPhone={selectedChatPhone}
            initialMessage={selectedChatMessage}
            onBack={selectedChatPhone ? () => {
              setSelectedChatPhone(null);
              setSelectedChatMessage(null);
            } : undefined}
          />
        );
      case 'leads':
        return (
          <LeadsView
            activeColor={activeColor}
            tenantId={currentTenantId}
            onChat={(lead) => {
              const cleanedPhone = lead.phone.replace(/\D/g, '');
              setSelectedChatPhone(cleanedPhone);
              setActiveView('auditoria');
            }}
          />
        );
      case 'soporte':
        return <SupportChatView activeColor={activeColor} />;
      case 'workflows':
        return <WorkflowView tenantId={currentTenantId} activeColor={activeColor} />;
      case 'knowledge':
        return <KnowledgeBaseView tenant={currentTenant} activeColor={activeColor} onSave={handleTenantSave} />;
      case 'pedidos':
        return (
          <OrderHistoryView
            orders={orders}
            activeColor={activeColor}
            onUpdateStatus={updateOrderStatus}
          />
        );
      case 'dashboard':
        if (!isSuperAdmin) {
          return <ConversationsView tenantId={currentTenantId} initialPhone={selectedChatPhone} initialMessage={selectedChatMessage} />;
        }
        return (
          <GlobalDashboard
            tenants={supabaseTenants}
            orders={orders}
            customers={customers}
            activeColor={activeColor}
            isGodmode={isSuperAdmin}
          />
        );
      case 'uso':
        return <UsageMetricsView tenantId={currentTenantId} activeColor={activeColor} />;
      case 'roi':
        return <ROIMetricsView orders={orders} tenant={currentTenant} activeColor={activeColor} />;
      case 'admin_tenants':
        return <AdminTenantsView activeColor={activeColor} />;
      case 'configuracion':
        return (
          <ConfigView
            tenant={currentTenant}
            activeColor={activeColor}
            onSave={handleTenantSave}
          />
        );
      default:
        return <div className="p-10 text-white italic opacity-40">Coming Soon...</div>;
    }
  };

  if (!isAuthenticated) {
    return <LoginView
      onLogin={(role) => {
        setIsAuthenticated(true);
        setIsSuperAdmin(role === 'admin');
        setActiveView('dashboard');
      }}
      onBack={() => { window.location.href = '/marketing-es.html'; }}
    />;
  }

  return (
    <div className="flex bg-slate-950 font-tech selection:bg-indigo-500/30 overflow-hidden h-[100dvh] w-full">

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar
          activeView={activeView}
          onViewChange={(v) => {
            setActiveView(v as any);
            setIsMobileSidebarOpen(false); // Close mobile sidebar on view change
          }}
          activeColor={activeColor}
          isSuperAdmin={isSuperAdmin}
          userName={userName}
          userEmail={userEmail}
          onLogout={handleLogout}
          tenants={supabaseTenants}
          currentTenantId={currentTenantId}
          onTenantChange={(id) => {
            setCurrentTenantId(id);
            setIsMobileSidebarOpen(false);
          }}
          lang={lang}
          onLangChange={setLang}
        />
      </div>

      <main className={`flex-1 flex flex-col min-w-0 relative custom-scrollbar overflow-hidden`}>
        {/* Mobile Top Header */}
        <header className="lg:hidden h-14 border-b border-white/10 bg-slate-950/80 backdrop-blur-md flex items-center px-4 justify-between shrink-0 relative z-30 shadow-md">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <Zap className="text-cyan-400 w-4 h-4" />
              <span className="font-black text-white text-sm tracking-wider truncate">{currentTenant?.name || 'IA AGUS'}</span>
            </div>
          </div>
          <button onClick={() => setIsMobileSidebarOpen(true)} className="p-2 -mr-2 text-slate-400 hover:text-white transition-colors">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Global Background Glows */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-900/5 rounded-full blur-[120px] pointer-events-none z-0" />

        <div className={`flex-1 relative z-10 overflow-y-auto ${activeView === 'auditoria' ? 'overflow-hidden' : ''} custom-scrollbar`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView + currentTenantId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className={`${activeView === 'auditoria' ? 'h-full' : 'min-h-full p-4 md:p-8'}`}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

    </div>
  );
}

export default App;
