import React, { useMemo } from 'react';
import type { MenuProps } from 'antd';
import { Dropdown } from 'antd';
import { CheckOutlined, DownOutlined } from '@ant-design/icons';
import type { ModelOption } from '../hooks/useModels';

export interface ModelSelectorProps {
  options: ModelOption[];
  value?: string;
  onChange?: (value: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ options, value, onChange }) => {
  const items = useMemo<MenuProps['items']>(() => {
    if (options.length === 0) {
      return [
        {
          key: 'empty',
          disabled: true,
          label: (
            <div className="flex flex-col gap-1 px-4 py-3">
              <span className="text-sm font-medium text-gray-500">暂无可用模型</span>
              <span className="text-xs text-gray-400">请稍后再试</span>
            </div>
          ),
        },
      ];
    }
    return options.map((opt) => ({
      key: opt.value,
      label: (
        <div className="flex items-center justify-between rounded-lg transition-colors hover:bg-gray-100">
          <div className="flex flex-col text-left">
            <span className="text-sm  text-gray-900">{opt.name}</span>
            <span className="text-xs text-gray-500">{opt.model}</span>
          </div>
          {value === opt.value ? (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-900">
              <CheckOutlined className="text-[10px] !text-white" />
            </span>
          ) : null}
        </div>
      ),
    }));
  }, [options, value]);

  const menu = useMemo<MenuProps>(
    () => ({
      items,
      onClick: ({ key }) => {
        if (key !== 'empty') onChange?.(key as string);
      },
      selectable: false,
      className:
        '!p-2 min-w-[280px] !rounded-xl !bg-white !shadow-[0_16px_32px_-20px_rgba(15,23,42,0.25)] !border !border-gray-100',
    }),
    [items, onChange],
  );

  const currentName = options.find((o) => o.value === value)?.name ?? '选择模型';

  return (
    <Dropdown trigger={['click']} placement="bottomLeft" overlayClassName="!p-0" menu={menu}>
      <div
        className="flex cursor-pointer items-center gap-2 rounded-md border border-transparent px-3 py-1 text-base font-medium text-gray-900 transition-colors hover:bg-gray-100"
        onClick={(event) => event.preventDefault()}
      >
        {currentName}
        <DownOutlined className="text-xs text-gray-500" />
      </div>
    </Dropdown>
  );
};

export default ModelSelector;

