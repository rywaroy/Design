import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import 'antd/dist/reset.css';
import './index.css';
import LoginPage from './pages/Login';
import { AuthProvider } from './contexts/AuthContext';

const Root = () => (
  <ConfigProvider
    theme={{
      token: {
        colorPrimary: '#111827',
        colorLink: '#111827',
        fontFamily: '"Inter", "PingFang SC", "Microsoft YaHei", sans-serif',
        borderRadius: 12,
      },
      components: {
        Button: {
          controlHeightLG: 48,
        },
        Input: {
          controlHeightLG: 48,
        },
      },
    }}
  >
    <AntApp>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AntApp>
  </ConfigProvider>
);

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />);
