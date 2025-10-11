import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { App as AntApp, Button, Menu, Spin } from 'antd';
import { useAuth } from '../../contexts/AuthContext';
import type { AuthUser } from '../../contexts/AuthContext';

const HEADER_MENU_CONFIG = [
  { key: 'project', label: '项目', path: '/' },
  { key: 'screen', label: '屏幕' },
] as const;

type HeaderMenuKey = (typeof HEADER_MENU_CONFIG)[number]['key'];

const getActiveMenuKey = (pathname: string): HeaderMenuKey => {
  const matched = HEADER_MENU_CONFIG.find((item) => {
    if (!item.path) {
      return false;
    }

    if (item.path === '/') {
      return pathname === '/';
    }

    return pathname.startsWith(item.path);
  });

  return matched?.key ?? 'project';
};

interface HeaderBarProps {
  user: AuthUser;
  activeMenuKey: HeaderMenuKey;
  onMenuClick: (key: HeaderMenuKey) => void;
  onLogout: () => Promise<void>;
}

const HeaderBar: React.FC<HeaderBarProps> = ({
  user,
  activeMenuKey,
  onMenuClick,
  onLogout,
}) => {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-6">
        <div className="flex flex-1 items-center">
          <div className="text-lg font-semibold text-gray-900">Design 控制台</div>
        </div>
        <div className="flex flex-1 justify-center">
          <Menu
            mode="horizontal"
            items={HEADER_MENU_CONFIG.map((item) => ({ key: item.key, label: item.label }))}
            selectedKeys={[activeMenuKey]}
            onClick={({ key }) => onMenuClick(key as HeaderMenuKey)}
            className="min-w-[200px] border-0 bg-transparent"
          />
        </div>
        <div className="flex flex-1 items-center justify-end gap-4 text-sm text-gray-600">
          <span>你好，{user.username}</span>
          <Button
            size="small"
            onClick={() => {
              void onLogout();
            }}
          >
            退出登录
          </Button>
        </div>
      </div>
    </header>
  );
};

const DefaultLayout: React.FC = () => {
  const { message } = AntApp.useApp();
  const { user, fetchCurrentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        await fetchCurrentUser();
      } catch (error) {
        if ((error as Error)?.message !== 'UNAUTHORIZED') {
          console.warn('获取用户信息失败：', error);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      active = false;
    };
  }, [fetchCurrentUser]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', {
        replace: true,
        state: { from: location.pathname },
      });
    }
  }, [loading, user, navigate, location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      message.success('已退出登录');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error(error);
      message.error('退出登录失败，请稍后再试');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spin size="large" tip="加载中" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const activeMenuKey = getActiveMenuKey(location.pathname);

  const handleMenuClick = (key: HeaderMenuKey) => {
    const target = HEADER_MENU_CONFIG.find((item) => item.key === key);
    if (!target) {
      return;
    }

    if (target.path) {
      navigate(target.path);
      return;
    }

    message.info(`${target.label} 功能即将上线`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <HeaderBar
        user={user}
        activeMenuKey={activeMenuKey}
        onMenuClick={handleMenuClick}
        onLogout={handleLogout}
      />

      <main className="flex flex-1 justify-center">
        <div className="w-full max-w-6xl px-6 py-8">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-4 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Design 团队，保留所有权利。
        </div>
      </footer>
    </div>
  );
};

export default DefaultLayout;
