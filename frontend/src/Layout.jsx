import { Outlet } from 'react-router-dom';
import Footer from './components/footer';
import Navbar from './components/navbar';

function Layout() {
  return (
    <div className="rvt-flex rvt-flex-column" style={{ height: '100vh' }}>
      <Navbar />
      <div className="rvt-flex rvt-flex-column" style={{ flex: 1 }}>
        <Outlet />
        <Footer />
      </div>
    </div>
  );
}

export default Layout;
