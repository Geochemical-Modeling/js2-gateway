import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Layout from './Layout';
import HomeNotificationToast from './components/home_notification_toast';
import Home from './pages/Home.jsx';
import NotFound from './pages/NotFound';
import { route_map } from './constants.js';
import CO2Calculator from './pages/CO2Calculator/CO2Calculator.jsx';
import CO2CalculatorOnline from './pages/CO2Calculator/CO2CalculatorOnline.jsx';
import Onboarding from './pages/Onboarding';
import AdminPage from './pages/AdminPage';
import { AuthProvider } from './AuthContext';
import OnboardingCheck from './components/onboarding_check';
import ApprovalRequired from './components/approval_required';
import RateScripts from './pages/RateScripts.jsx';
import H2SCalculator from './pages/H2SCalculator/H2SCalculator.jsx';
import H2SCalculatorOnline from './pages/H2SCalculator/H2SCalculatorOnline.jsx';
import RateCalculator from './pages/RateCalculator/RateCalculator.jsx';
import RateCalculatorOnline from './pages/RateCalculator/RateCalculatorOnline.jsx';
import Phreeqc from './pages/Phreeqc/Phreeqc.jsx';
import PhreeqcOnline from './pages/Phreeqc/PhreeqcOnline.jsx';
function App() {
  return (
    <AuthProvider>
      <Router>
        <OnboardingCheck />
        <HomeNotificationToast />
        <Routes>
          <Route element={<Layout />}>
            {/* Public routes accessible to all users */}
            <Route path="/" element={<Home />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path={route_map.ADMIN_PAGE} element={<AdminPage />} />

            {/* Protected routes requiring approval */}
            <Route element={<ApprovalRequired />}>
              {/* Tool routes */}
              <Route
                path={route_map.COTWO_CALCULATOR}
                element={<CO2Calculator />}
              />
              <Route
                path={route_map.COTWO_CALCULATOR_ONLINE}
                element={<CO2CalculatorOnline />}
              />
              <Route path={route_map.PHREEQC} element={<Phreeqc />} />
              <Route
                path={route_map.PHREEQC_ONLINE}
                element={<PhreeqcOnline />}
              />

              <Route path={route_map.SUPCRTBL} element={<NotFound />} />
              <Route path={route_map.RATE_SCRIPTS} element={<RateScripts />} />
              <Route
                path={route_map.H2S_CALCULATOR}
                element={<H2SCalculator />}
              />
              <Route
                path={route_map.H2S_CALCULATOR_ONLINE}
                element={<H2SCalculatorOnline />}
              />
              <Route
                path={route_map.RATE_CALCULATOR}
                element={<RateCalculator />}
              />
              <Route
                path={route_map.RATE_CALCULATOR_ONLINE}
                element={<RateCalculatorOnline />}
              />
              <Route path={route_map.H2S_CALCULATOR} element={<NotFound />} />
              <Route
                path={route_map.SOLUBILITY_CALCULATOR}
                element={<NotFound />}
              />
            </Route>

            {/* Catch-all route for undefined paths */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
