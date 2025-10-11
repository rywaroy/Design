import { useEffect, useMemo, useState } from 'react';
import { App as AntApp, Button, Form, Input, Typography } from 'antd';
import type { FormProps } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import loginSideImage from '../../assets/login-side.webp';
import type { LoginPayload } from '../../services/auth';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Paragraph, Text } = Typography;

interface LoginFormValues extends LoginPayload {
  remember?: boolean;
}

const formItemStyle = {
  borderRadius: 9999,
};

const LoginPage: React.FC = () => {
  const { message } = AntApp.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);

  const initialValues = useMemo<LoginFormValues>(
    () => ({
      username: '',
      password: '',
    }),
    [],
  );

  const redirectPath = (location.state as { from?: string } | undefined)?.from ?? '/';

  useEffect(() => {
    if (user) {
      navigate(redirectPath, { replace: true });
    }
  }, [navigate, redirectPath, user]);

  const handleFinish: FormProps<LoginFormValues>['onFinish'] = async (values) => {
    setLoading(true);
    try {
      const response = await login({
        username: values.username.trim(),
        password: values.password,
      });

      message.success(response.message || '登录成功');
      navigate(redirectPath, { replace: true });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white text-[#1F1F1F]">
      <div className="flex w-full flex-col justify-between px-6 py-10 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-[420px]">
          <div className="mb-12 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-xl font-semibold text-white">
              D
            </span>
            <Text className="text-lg font-medium text-gray-900">Design</Text>
          </div>

          <header className="mb-10">
            <Title level={1} className="!mb-4 !text-4xl !font-semibold text-gray-900">
              欢迎回来
            </Title>
            <Paragraph className="!mb-0 text-base text-gray-500">
              输入账号与密码登录控制台，开始管理你的设计项目。
            </Paragraph>
          </header>

          <Form<LoginFormValues>
            layout="vertical"
            size="large"
            requiredMark={false}
            initialValues={initialValues}
            onFinish={handleFinish}
          >
            <Form.Item
              label="账号"
              name="username"
              rules={[{ required: true, message: '请输入账号' }]}
              className="text-sm"
            >
              <Input
                placeholder="请输入账号"
                autoComplete="username"
                className="h-12 border-gray-200 px-5 text-base"
                style={formItemStyle}
              />
            </Form.Item>

            <Form.Item
              label="密码"
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, max: 20, message: '密码长度需为 6-20 位' },
              ]}
              className="text-sm"
            >
              <Input.Password
                placeholder="请输入密码"
                autoComplete="current-password"
                className="h-12 border-gray-200 px-5 text-base"
                style={formItemStyle}
              />
            </Form.Item>

            <Form.Item className="!mb-6">
              <Button
                type="primary"
                htmlType="submit"
                shape="round"
                size="large"
                loading={loading}
                className="h-12 w-full text-base font-medium shadow-sm"
              >
                登录
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center text-sm text-gray-500">
            还没有账号？<a className="text-gray-900 underline" href="#">联系管理员创建</a>
          </div>
        </div>

        <div className="mt-16 hidden flex-col gap-6 text-sm text-gray-400 sm:flex">
          <span className="uppercase tracking-[0.3em] text-gray-300">Trusted by teams at</span>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-gray-500">
            <span>Headspace</span>
            <span>Airbnb</span>
            <span>Revolut</span>
            <span>Duolingo</span>
          </div>
        </div>
      </div>

      <div className="relative hidden flex-1 overflow-hidden bg-gray-100 lg:block">
        <img
          src={loginSideImage}
          alt="设计案例演示"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0F172A]/40 via-transparent to-transparent" />
      </div>
    </div>
  );
};

export default LoginPage;
