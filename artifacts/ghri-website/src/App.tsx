import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TelehealthAuthProvider } from "@/contexts/TelehealthAuthContext";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import About from "@/pages/about";
import Programs from "@/pages/programs";
import GetInvolved from "@/pages/get-involved";
import Donate from "@/pages/donate";
import Contact from "@/pages/contact";
import Blog from "@/pages/blog";

import TelehealthGateway from "@/pages/telehealth/gateway";
import TelehealthLogin from "@/pages/telehealth/login";
import TelehealthRegister from "@/pages/telehealth/register";
import MfaSetup from "@/pages/telehealth/mfa-setup";
import MfaVerify from "@/pages/telehealth/mfa-verify";
import AuditLog from "@/pages/telehealth/audit-log";

import PatientDashboard from "@/pages/telehealth/patient/dashboard";
import PatientAppointments from "@/pages/telehealth/patient/appointments";
import PatientMessages from "@/pages/telehealth/patient/messages";
import PatientDocuments from "@/pages/telehealth/patient/documents";
import PatientPrescriptions from "@/pages/telehealth/patient/prescriptions";

import ProviderDashboard from "@/pages/telehealth/provider/dashboard";
import ProviderAppointments from "@/pages/telehealth/provider/appointments";
import ProviderPatients from "@/pages/telehealth/provider/patients";
import ProviderMessages from "@/pages/telehealth/provider/messages";
import ProviderPrescriptions from "@/pages/telehealth/provider/prescriptions";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/programs" component={Programs} />
      <Route path="/get-involved" component={GetInvolved} />
      <Route path="/donate" component={Donate} />
      <Route path="/contact" component={Contact} />
      <Route path="/blog" component={Blog} />
      
      <Route path="/telehealth" component={TelehealthGateway} />
      <Route path="/telehealth/login" component={TelehealthLogin} />
      <Route path="/telehealth/register" component={TelehealthRegister} />
      <Route path="/telehealth/mfa/setup" component={MfaSetup} />
      <Route path="/telehealth/mfa" component={MfaVerify} />
      <Route path="/telehealth/audit-log" component={AuditLog} />
      
      <Route path="/telehealth/patient/dashboard" component={PatientDashboard} />
      <Route path="/telehealth/patient/appointments" component={PatientAppointments} />
      <Route path="/telehealth/patient/messages" component={PatientMessages} />
      <Route path="/telehealth/patient/documents" component={PatientDocuments} />
      <Route path="/telehealth/patient/prescriptions" component={PatientPrescriptions} />
      
      <Route path="/telehealth/provider/dashboard" component={ProviderDashboard} />
      <Route path="/telehealth/provider/appointments" component={ProviderAppointments} />
      <Route path="/telehealth/provider/patients" component={ProviderPatients} />
      <Route path="/telehealth/provider/messages" component={ProviderMessages} />
      <Route path="/telehealth/provider/prescriptions" component={ProviderPrescriptions} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
          <TelehealthAuthProvider>
            <Router />
          </TelehealthAuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
