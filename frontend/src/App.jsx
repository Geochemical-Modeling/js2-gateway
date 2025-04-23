import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Layout from './Layout';
import HomeNotificationToast from './components/home_notification_toast';
import Home from './pages/Home.jsx';
import NotFound from './pages/NotFound';
import { route_map } from './constants.js';
import CO2Calculator from './pages/CO2Calculator/CO2Calculator.jsx';
import CO2CalculatorOnline from './pages/CO2Calculator/CO2CalculatorOnline.jsx';
import Onboarding from './pages/Onboarding';
import { AuthProvider } from './AuthContext';
import OnboardingCheck from './components/onboarding_check';

function App() {
  return (
    <AuthProvider>
      <Router>
        <OnboardingCheck />
        <HomeNotificationToast />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="*" element={<NotFound />} />

            {/* Tool routes */}
            <Route
              path={route_map.COTWO_CALCULATOR}
              element={<CO2Calculator />}
            />
            <Route
              path={route_map.COTWO_CALCULATOR_ONLINE}
              element={<CO2CalculatorOnline />}
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
