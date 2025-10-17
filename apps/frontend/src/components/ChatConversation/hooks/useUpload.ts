import { useCallback, useState } from 'react';
import type { UploadFile, UploadProps } from 'antd';
import { Upload } from 'antd';
import { uploadImages } from '../../../services/chat';
import { normalizeUploadResult } from '../utils';
import type { UploadResultItem } from '../types';

interface UseUploadOptions {
  maxImageCount: number;
  notifyError?: (msg: string, error?: Error) => void;
}

export const useUpload = (options: UseUploadOptions) => {
  const { maxImageCount, notifyError } = options;
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const customRequest: UploadProps['customRequest'] = async ({
    file,
    onError: uploadOnError,
    onSuccess,
  }) => {
    try {
      const result = await uploadImages([file as File]);
      const normalized = normalizeUploadResult(result.data);
      if (!normalized) {
        throw new Error('图片上传失败');
      }

      setFileList((prev) =>
        prev.map((item) =>
          item.originFileObj === file
            ? {
                ...item,
                status: 'done',
                url: normalized.url,
                thumbUrl: normalized.url,
                name: normalized.name ?? item.name,
                response: normalized,
              }
            : item,
        ),
      );
      onSuccess?.(normalized);
    } catch (error) {
      setFileList((prev) => prev.filter((item) => item.originFileObj !== file));
      uploadOnError?.(error as Error);
      notifyError?.('图片上传失败，请稍后重试', error as Error);
    }
  };

  const onChange: UploadProps['onChange'] = ({ fileList: nextList }) => {
    const normalized = nextList.map((item) => {
      const response = item.response as UploadResultItem | undefined;
      if (!item.url && response?.url) {
        item.url = response.url;
        item.thumbUrl = response.url;
      }
      return item;
    });
    setFileList(normalized);
  };

  const onRemove: UploadProps['onRemove'] = (file) => {
    setFileList((prev) => prev.filter((item) => item.uid !== file.uid));
  };

  const beforeUpload: UploadProps['beforeUpload'] = (file, files) => {
    const remaining = maxImageCount - fileList.length;
    if (remaining <= 0) {
      notifyError?.(`最多上传 ${maxImageCount} 张图片`);
      return Upload.LIST_IGNORE;
    }

    if (files.length > remaining) {
      return files.slice(0, remaining).includes(file);
    }

    return true;
  };

  const reset = useCallback(() => {
    setFileList([]);
  }, []);

  const getImageUrls = useCallback(() => {
    return fileList
      .map((item) => item.url || (item.response as UploadResultItem | undefined)?.url)
      .filter((url): url is string => Boolean(url));
  }, [fileList]);

  return {
    fileList,
    setFileList,
    customRequest,
    onChange,
    onRemove,
    beforeUpload,
    reset,
    getImageUrls,
  } as const;
};

export default useUpload;

