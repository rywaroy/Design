import { useEffect, useMemo, useState } from 'react';
import { listModels } from '../../../services/chat';

export type ModelOption = {
  value: string;
  name: string;
  model: string;
};

interface UseModelsOptions {
  onError?: (error: Error) => void;
  notifyError?: (msg: string, error?: Error) => void;
}

export const useModels = (options?: UseModelsOptions) => {
  const { onError, notifyError } = options ?? {};
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [activeModel, setActiveModel] = useState<string>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchModels = async () => {
      try {
        setLoading(true);
        const response = await listModels();
        const enabled = response.data.filter((item) => item.enabled);
        const options = enabled
          .map((item): ModelOption | null => {
            const modelValue = item.model ?? item.name;
            if (!modelValue) {
              return null;
            }
            const displayName = item.name ?? item.model ?? modelValue;
            return {
              value: modelValue,
              name: displayName,
              model: item.model ?? modelValue,
            };
          })
          .filter((item): item is ModelOption => Boolean(item));
        if (!mounted) {
          return;
        }
        setModelOptions(options);
        setActiveModel((prev) => {
          if (prev && options.some((option) => option.value === prev)) {
            return prev;
          }
          return options[0]?.value;
        });
      } catch (error) {
        notifyError?.('获取模型列表失败', error as Error);
        onError?.(error as Error);
      } finally {
        setLoading(false);
      }
    };

    void fetchModels();
    return () => {
      mounted = false;
    };
  }, [notifyError, onError]);

  const currentModel = useMemo(
    () => modelOptions.find((opt) => opt.value === activeModel),
    [activeModel, modelOptions],
  );

  return {
    loading,
    modelOptions,
    activeModel,
    setActiveModel,
    currentModel,
  } as const;
};

export default useModels;

