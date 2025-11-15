import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { App as AntApp, Button, Dropdown, Spin } from 'antd';
import type { MenuProps } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import type { AuthUser } from '../../contexts/AuthContext';

const HEADER_MENU_CONFIG = [
  { key: 'project', label: 'Apps', path: '/' },
  { key: 'screen', label: 'Screens', path: '/screen' },
  { key: 'chat', label: 'AI Chat', path: '/chat' },
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
  onOpenFavorite: () => void;
}

const HeaderBar: React.FC<HeaderBarProps> = ({
  user,
  activeMenuKey,
  onMenuClick,
  onLogout,
  onOpenFavorite,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const userMenuItems: MenuProps['items'] = [
    { key: 'favorite', label: '我的收藏' },
    { type: 'divider' },
    { key: 'logout', label: '退出登录' },
  ];

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'favorite') {
      onOpenFavorite();
      return;
    }

    if (key === 'logout') {
      void onLogout();
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const headerBackgroundClass = scrolled
    ? 'bg-white/80 shadow-md backdrop-blur supports-[backdrop-filter]:bg-white/60'
    : 'bg-white';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 border-b border-gray-200 transition-colors duration-300 ${headerBackgroundClass}`}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-6">
        <div className="flex flex-1 items-center">
          <div
            className="cursor-pointer text-[32px] font-semibold text-gray-900 transition-colors hover:text-gray-700"
            role="button"
            tabIndex={0}
            onClick={() => onMenuClick('project')}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onMenuClick('project');
              }
            }}
          >
            Design
          </div>
        </div>
        <div className="flex flex-1 justify-center">
          <nav className="flex flex-wrap items-center gap-1">
            {HEADER_MENU_CONFIG.map((item) => {
              const isActive = item.key === activeMenuKey;
              return (
                <Button
                  key={item.key}
                  type="text"
                  onClick={() => onMenuClick(item.key)}
                  className={`group relative rounded-full px-4 py-2 text-sm font-medium transition-colors hover:!bg-transparent focus:!bg-transparent active:!bg-transparent ${
                    isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <span className="flex items-center gap-2">{item.label}</span>
                  <span
                    className={`pointer-events-none absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-black transition-all ${
                      isActive ? 'w-full' : 'group-hover:w-full'
                    }`}
                  />
                </Button>
              );
            })}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end text-sm text-gray-600">
          <Dropdown
            menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Button type="text" className="flex items-center gap-1 text-sm text-gray-700">
              <span>你好，{user.username}</span>
              <DownOutlined className="text-xs" />
            </Button>
          </Dropdown>
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

  const handleOpenFavorite = () => {
    navigate('/favorite');
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <HeaderBar
        user={user}
        activeMenuKey={activeMenuKey}
        onMenuClick={handleMenuClick}
        onLogout={handleLogout}
        onOpenFavorite={handleOpenFavorite}
      />

      <main className="flex flex-1 justify-center pt-16">
        <div className="w-full max-w-6xl px-3 py-4">
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
