import React, { useMemo } from 'react';
import type { MenuProps } from 'antd';
import { Dropdown } from 'antd';
import { DownOutlined } from '@ant-design/icons';

export interface AspectRatioOption {
  label: string;
  value: string;
}

export interface AspectRatioSelectorProps {
  options: AspectRatioOption[];
  value?: string;
  onChange?: (value: string) => void;
}

const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({ options, value, onChange }) => {
  const items = useMemo<MenuProps['items']>(() => {
    return options.map((opt) => ({ key: opt.value, label: opt.label }));
  }, [options]);

  const menu = useMemo<MenuProps>(
    () => ({
      items,
      onClick: ({ key }) => onChange?.(key as string),
      selectable: false,
    }),
    [items, onChange],
  );

  const label = options.find((o) => o.value === value)?.label ?? '--';

  return (
    <Dropdown trigger={['click']} placement="topLeft" overlayClassName="!p-0" menu={menu}>
      <div
        className="flex h-10 cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 transition hover:border-gray-300 hover:bg-gray-100"
        onClick={(event) => event.preventDefault()}
      >
        <span className="text-gray-700">比例：{label}</span>
        <DownOutlined className="text-xs text-gray-500" />
      </div>
    </Dropdown>
  );
};

export default AspectRatioSelector;

