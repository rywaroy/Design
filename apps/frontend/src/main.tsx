import ReactDOM from 'react-dom/client';
import { ConfigProvider, App as AntApp } from 'antd';
import 'antd/dist/reset.css';
import './index.css';

const Root = () => (
  <ConfigProvider>
    <AntApp>
      <div>Root</div>
    </AntApp>
  </ConfigProvider>
);

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />);
