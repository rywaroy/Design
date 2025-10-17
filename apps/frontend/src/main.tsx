import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import 'antd/dist/reset.css';
import './index.css';
import LoginPage from './pages/Login';
import ProjectPage from './pages/Project';
import ProjectDetailPage from './pages/ProjectDetail';
import ScreenListPage from './pages/Screen';
import FavoritePage from './pages/Favorite';
import DefaultLayout from './layout/Default';
import { AuthProvider } from './contexts/AuthContext';
import { ProjectListProvider } from './contexts/ProjectListContext';
import { FavoriteProvider } from './contexts/FavoriteContext';
import ChatPage from './pages/Chat';

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
        <ProjectListProvider>
          <FavoriteProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route element={<DefaultLayout />}>
                  <Route path="/" element={<ProjectPage />} />
                  <Route path="/screen" element={<ScreenListPage />} />
                  <Route path="/project/:projectId" element={<ProjectDetailPage />} />
                  <Route path="/favorite" element={<FavoritePage />} />
                  <Route path="/chat" element={<ChatPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </FavoriteProvider>
        </ProjectListProvider>
      </AuthProvider>
    </AntApp>
  </ConfigProvider>
);

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />);
