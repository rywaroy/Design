import type { FC, MouseEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Spin } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import type { ScreenFilterResponse } from '../../services/screen';
import {
  SCREEN_FILTER_FIELDS,
  createInitialFilterSelection,
  type ScreenFilterFieldConfig,
  type ScreenFilterKey,
  type ScreenFilterSelectionState,
} from '../../constants/screenFilters';

const cloneSelection = (value: ScreenFilterSelectionState): ScreenFilterSelectionState =>
  SCREEN_FILTER_FIELDS.reduce<ScreenFilterSelectionState>((acc, field) => {
    acc[field.key] = [...(value[field.key] ?? [])];
    return acc;
  }, {} as ScreenFilterSelectionState);

interface ScreenFilterModalProps {
  open: boolean;
  loading?: boolean;
  filters: ScreenFilterResponse | null;
  value: ScreenFilterSelectionState;
  onApply: (value: ScreenFilterSelectionState) => void;
  onClose: () => void;
}

const ScreenFilterModal: FC<ScreenFilterModalProps> = ({ open, loading, filters, value, onApply, onClose }) => {
  const [activeKey, setActiveKey] = useState<ScreenFilterKey>(SCREEN_FILTER_FIELDS[0].key);
  const [draft, setDraft] = useState<ScreenFilterSelectionState>(createInitialFilterSelection());

  useEffect(() => {
    if (!open) {
      return;
    }
    setDraft(cloneSelection(value));
    if (!filters) {
      return;
    }
    const activeFieldExists = SCREEN_FILTER_FIELDS.some((field) => field.key === activeKey);
    if (!activeFieldExists) {
      setActiveKey(SCREEN_FILTER_FIELDS[0].key);
    }
  }, [activeKey, filters, open, value]);

  const handleClose = (event?: MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation();
    onClose();
  };

  const handleReset = () => {
    setDraft(createInitialFilterSelection());
  };

  const handleOptionToggle = (field: ScreenFilterFieldConfig, option: string) => {
    setDraft((prev) => {
      const next = cloneSelection(prev);
      const current = next[field.key] ?? [];
      if (field.multiple) {
        if (current.includes(option)) {
          next[field.key] = current.filter((item) => item !== option);
        } else {
          next[field.key] = [...current, option];
        }
      } else {
        next[field.key] = current.includes(option) ? [] : [option];
      }
      return next;
    });
  };

  const handleApply = () => {
    onApply(cloneSelection(draft));
    onClose();
  };

  const activeField = useMemo(
    () => SCREEN_FILTER_FIELDS.find((field) => field.key === activeKey) ?? SCREEN_FILTER_FIELDS[0],
    [activeKey],
  );

  const options = useMemo(() => {
    if (!filters) {
      return [];
    }
    const candidates = filters[activeField.key] ?? [];
    return candidates;
  }, [activeField.key, filters]);

  const hasOptions = options.length > 0;

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative flex h-[80vh] w-[90vw] max-w-5xl overflow-hidden rounded-[32px] bg-[#1F2430] text-white shadow-2xl ring-1 ring-black/40">
        <button
          type="button"
          aria-label="关闭筛选"
          onClick={handleClose}
          className="absolute right-6 top-6 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-gray-200 transition hover:bg-white/20"
        >
          <CloseOutlined />
        </button>

        <aside className="flex w-64 flex-col border-r border-white/10 bg-white/5">
          <header className="flex h-20 items-center px-6 text-lg font-semibold text-white/80">
            筛选条件
          </header>
          <nav className="flex-1 space-y-1 overflow-y-auto px-2 pb-6">
            {SCREEN_FILTER_FIELDS.map((field) => {
              const active = field.key === activeField.key;
              return (
                <button
                  key={field.key}
                  type="button"
                  onClick={() => setActiveKey(field.key)}
                  className={`w-full rounded-2xl px-5 py-3 text-left text-sm transition ${
                    active ? 'bg-white/15 text-white shadow-inner' : 'text-white/60 hover:bg-white/10 hover:text-white/90'
                  }`}
                >
                  {field.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-white/10 px-8 py-6">
            <div>
              <h2 className="text-xl font-semibold text-white">{activeField.label}</h2>
              <p className="mt-1 text-sm text-white/60">
                {activeField.multiple ? '可多选' : '单选'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:border-white/40 hover:text-white"
                onClick={handleReset}
              >
                重置
              </button>
              <button
                type="button"
                className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-gray-900 shadow hover:bg-white/90"
                onClick={handleApply}
              >
                应用
              </button>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Spin tip="加载筛选项" />
              </div>
            ) : hasOptions ? (
              <div className="flex flex-wrap gap-3">
                {options.map((option) => {
                  const selected = draft[activeField.key]?.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      className={`rounded-full px-5 py-2 text-sm transition ${
                        selected
                          ? 'bg-white text-gray-900 shadow'
                          : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
                      }`}
                      onClick={() => handleOptionToggle(activeField, option)}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-white/60">
                暂无可用选项
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ScreenFilterModal;
