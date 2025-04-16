import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Layout from './Layout';
import HomeNotificationToast from './components/home_notification_toast';
import Home from './pages/Home.jsx';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <HomeNotificationToast />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
