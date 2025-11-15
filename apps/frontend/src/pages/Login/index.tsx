import { useEffect, useMemo, useState } from 'react';
import { App as AntApp, Button, Form, Input, Typography } from 'antd';
import type { FormProps } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import type { LoginPayload } from '../../services/auth';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Paragraph, Text } = Typography;

interface LoginFormValues extends LoginPayload {
  remember?: boolean;
}

const roundedStyle = {
  borderRadius: 12,
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
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12 text-[#1F1F1F]">
      <div className="w-full max-w-[420px]">
        <header className="mb-10 text-center">
          <Title level={1} className="!mb-4 !text-4xl ! text-gray-900">
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
            label=""
            name="username"
            rules={[{ required: true, message: '请输入账号' }]}
            className="text-sm"
          >
            <Input
              placeholder="请输入账号"
              autoComplete="username"
              className="h-12 border-gray-200 px-5 text-base"
              style={roundedStyle}
            />
          </Form.Item>

          <Form.Item
            label=""
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
              style={roundedStyle}
            />
          </Form.Item>

          <Form.Item className="!mb-6">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              className="h-12 w-full text-base font-medium shadow-sm"
              style={roundedStyle}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center text-sm text-gray-500">
          还没有账号？<a className="text-gray-900 underline" href="#">联系管理员创建</a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
