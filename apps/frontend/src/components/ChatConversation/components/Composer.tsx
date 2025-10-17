import React from 'react';
import { Dropdown, Image, Input, Upload } from 'antd';
import { CloseOutlined, PauseOutlined, PlusOutlined, SendOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import type { UploadResultItem } from '../types';
import AspectRatioSelector, { type AspectRatioOption } from './AspectRatioSelector';

export interface ComposerProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement>;
  placeholder?: string;

  // Upload
  fileList: UploadFile[];
  beforeUpload: UploadProps['beforeUpload'];
  onChange: UploadProps['onChange'];
  onRemove: UploadProps['onRemove'];
  customRequest: UploadProps['customRequest'];

  // Aspect ratio
  aspectRatioOptions: AspectRatioOption[];
  aspectRatio: string;
  onAspectRatioChange: (value: string) => void;

  // Submit
  sending: boolean;
  submitting: boolean;
  canSubmit: boolean;
  hasActiveModel: boolean;
  onSubmit: () => void | Promise<void>;
}

const Composer: React.FC<ComposerProps> = ({
  inputValue,
  onInputChange,
  onKeyDown,
  placeholder,
  fileList,
  beforeUpload,
  onChange,
  onRemove,
  customRequest,
  aspectRatioOptions,
  aspectRatio,
  onAspectRatioChange,
  sending,
  submitting,
  canSubmit,
  hasActiveModel,
  onSubmit,
}) => {
  return (
    <div className="px-6 py-4">
      <div className="flex flex-col gap-3">
        {fileList.length > 0 && (
          <Image.PreviewGroup
            items={fileList
              .map((file) => {
                const response = file.response as UploadResultItem | undefined;
                const url = file.thumbUrl || file.url || response?.url;
                return url ? { src: url } : null;
              })
              .filter((item): item is { src: string } => Boolean(item))}
          >
            <div className="flex flex-wrap gap-3">
              {fileList.map((file) => {
                const response = file.response as UploadResultItem | undefined;
                const url = file.thumbUrl || file.url || response?.url;
                return (
                  <div
                    key={file.uid}
                    className="group relative h-20 w-20 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50"
                  >
                    {url ? (
                      <Image src={url} alt={file.name ?? '已上传图片'} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-gray-500">
                        {file.name ?? '图片'}
                      </div>
                    )}
                    <button
                      type="button"
                      className="absolute right-1.5 top-1.5 hidden h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white transition group-hover:flex"
                      onClick={() => onRemove?.(file)}
                    >
                      <CloseOutlined className="text-xs" />
                    </button>
                  </div>
                );
              })}
            </div>
          </Image.PreviewGroup>
        )}

        <div className="flex flex-col gap-3 rounded-[22px] border border-gray-200 bg-white px-6 py-4 shadow-sm">
          <Input.TextArea
            autoSize={{ minRows: 1, maxRows: 6 }}
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            bordered={false}
            className="!bg-transparent !px-0 !py-1 !text-base !text-gray-900 !leading-6 !shadow-none"
          />
          <div className="flex items-center gap-3 pt-1">
            <Dropdown
              trigger={['click']}
              placement="topLeft"
              menu={{
                items: [
                  {
                    key: 'upload',
                    label: (
                      <Upload
                        showUploadList={false}
                        fileList={fileList}
                        beforeUpload={beforeUpload}
                        onChange={onChange}
                        onRemove={onRemove}
                        customRequest={customRequest}
                        multiple
                        accept="image/*"
                      >
                        <div className="flex items-center justify-between rounded-lg text-sm text-gray-700 transition-colors">
                          上传图片
                        </div>
                      </Upload>
                    ),
                  },
                  {
                    key: 'favorites',
                    label: (
                      <div className="rounded-lg text-sm text-gray-400 transition-colors">选择收藏（敬请期待）</div>
                    ),
                    disabled: true,
                  },
                ],
                className:
                  '!border !border-gray-100 !bg-white !p-2 !shadow-[0_20px_35px_-25px_rgba(15,23,42,0.35)] !rounded-2xl',
              }}
            >
              <button
                type="button"
                aria-label="打开上传菜单"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:border-gray-300 hover:bg-gray-100 cursor-pointer"
              >
                <PlusOutlined />
              </button>
            </Dropdown>

            <AspectRatioSelector
              options={aspectRatioOptions}
              value={aspectRatio}
              onChange={onAspectRatioChange}
            />

            <div
              className={`ml-auto flex w-10 h-10 items-center rounded-full justify-center border transition cursor-pointer ${
                sending
                  ? '!border-black !bg-black !text-white'
                  : '!border-gray-200 !bg-white !text-gray-900 hover:!border-gray-300 hover:!bg-gray-100'
              } ${
                !canSubmit || submitting || !hasActiveModel
                  ? '!cursor-not-allowed !opacity-60 hover:!bg-white hover:!text-gray-900'
                  : ''
              }`}
              onClick={() => void onSubmit()}
            >
              {sending ? <PauseOutlined /> : <SendOutlined />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Composer;

