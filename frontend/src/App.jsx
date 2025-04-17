import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Layout from './Layout';
import HomeNotificationToast from './components/home_notification_toast';
import Home from './pages/Home.jsx';
import RateScripts from './pages/RateScripts.tsx';
import CO2CalculatorDisclaimer from "./pages/CO2/CO2CalculatorDisclaimer.tsx";
import CO2CalculatorOnline from './pages/CO2/CO2CalculatorOnline.tsx';
import NotFound from './pages/NotFound';
import { route_map } from './constants.ts';
import H2SCalculatorDisclaimer from './pages/H2S/H2SCalculatorDisclaimer.tsx';
import H2SCalculatorOnline from './pages/H2S/H2SCalculatorOnline.tsx';


function App() {
  return (
    <Router>
      <HomeNotificationToast />
      <Routes>
        <Route element={<Layout />}>
          <Route path={route_map.HOME} element={<Home />} />
          <Route path={route_map.RATE_SCRIPTS} element={<RateScripts/>}/>
          <Route path={route_map.COTWO_CALCULATOR} element={<CO2CalculatorDisclaimer />}/>
          <Route path={route_map.COTWO_CALCULATOR_ONLINE} element={<CO2CalculatorOnline />}/>

          <Route path={route_map.H2S_CALCULATOR} element={<H2SCalculatorDisclaimer/>} />
          <Route path={route_map.H2S_CALCULATOR_ONLINE} element={<H2SCalculatorOnline/>}/>
          
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
