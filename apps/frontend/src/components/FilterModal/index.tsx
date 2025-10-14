import type { FC, MouseEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Spin, Tag } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

export interface FilterFieldConfig {
  key: string;
  label: string;
  multiple?: boolean;
}

export type FilterSelectionState = Record<string, string[]>;

const cloneSelection = (fields: FilterFieldConfig[], value: FilterSelectionState): FilterSelectionState => {
  const next: FilterSelectionState = {};
  fields.forEach((field) => {
    next[field.key] = [...(value[field.key] ?? [])];
  });
  return next;
};

const createInitialSelection = (fields: FilterFieldConfig[]): FilterSelectionState => {
  const initial: FilterSelectionState = {};
  fields.forEach((field) => {
    initial[field.key] = [];
  });
  return initial;
};

const createInitialParents = (fields: FilterFieldConfig[]): Record<string, string | null> => {
  const parents: Record<string, string | null> = {};
  fields.forEach((field) => {
    parents[field.key] = null;
  });
  return parents;
};

export interface FilterModalProps {
  open: boolean;
  loading?: boolean;
  fields: FilterFieldConfig[];
  primaryOptions: Record<string, string[]>;
  childrenOptions: Record<string, Record<string, string[]>>;
  value: FilterSelectionState;
  onFetchChildren: (fieldKey: string, parent: string) => Promise<string[]>;
  onApply: (value: FilterSelectionState) => void;
  onClose: () => void;
}

const FilterModal: FC<FilterModalProps> = ({
  open,
  loading = false,
  fields,
  primaryOptions,
  childrenOptions,
  value,
  onFetchChildren,
  onApply,
  onClose,
}) => {
  const [activeFieldKey, setActiveFieldKey] = useState(() => fields[0]?.key ?? '');
  const [draft, setDraft] = useState<FilterSelectionState>(() => createInitialSelection(fields));
  const [activeParents, setActiveParents] = useState<Record<string, string | null>>(() =>
    createInitialParents(fields),
  );
  const [childrenLoading, setChildrenLoading] = useState(false);
  const [firstLevelSearch, setFirstLevelSearch] = useState('');

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const styleId = 'filter-modal-scrollbar';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = `
        .custom-scrollbar-container::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .custom-scrollbar-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.24);
          border-radius: 999px;
        }
        .custom-scrollbar-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.06);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.24);
          border-radius: 999px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
      `;
      document.head.appendChild(styleEl);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setFirstLevelSearch('');
      return;
    }
    setDraft(cloneSelection(fields, value));
    setChildrenLoading(false);
    setActiveParents((prev) => {
      const next = { ...prev };
      fields.forEach((field) => {
        if (!(field.key in next)) {
          next[field.key] = null;
        }
      });
      return next;
    });

    if (fields.length > 0 && !fields.some((field) => field.key === activeFieldKey)) {
      setActiveFieldKey(fields[0].key);
    }
  }, [open, value, fields, activeFieldKey]);

  useEffect(() => {
    setChildrenLoading(false);
    setFirstLevelSearch('');
  }, [activeFieldKey]);

  useEffect(() => {
    setDraft((prev) => cloneSelection(fields, prev));
    setActiveParents((prev) => ({
      ...createInitialParents(fields),
      ...prev,
    }));
  }, [fields]);

  if (!fields.length) {
    return null;
  }

  const activeField = fields.find((field) => field.key === activeFieldKey) ?? fields[0];

  const handleClose = (event?: MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation();
    onClose();
  };

  const handleReset = () => {
    setDraft(createInitialSelection(fields));
    setActiveParents(createInitialParents(fields));
    setFirstLevelSearch('');
  };

  const handleApply = () => {
    onApply(cloneSelection(fields, draft));
    onClose();
  };

  const handleParentClick = async (parent: string) => {
    setActiveParents((prev) => ({
      ...prev,
      [activeFieldKey]: parent,
    }));

    if (childrenOptions[activeFieldKey]?.[parent]) {
      return;
    }
    setChildrenLoading(true);
    try {
      await onFetchChildren(activeFieldKey, parent);
    } finally {
      setChildrenLoading(false);
    }
  };

  const handleChildToggle = (option: string) => {
    setDraft((prev) => {
      const next = cloneSelection(fields, prev);
      const current = next[activeFieldKey] ?? [];
      const multiple = activeField.multiple ?? true;

      if (multiple) {
        next[activeFieldKey] = current.includes(option)
          ? current.filter((item) => item !== option)
          : [...current, option];
      } else {
        next[activeFieldKey] = current.includes(option) ? [] : [option];
      }

      return next;
    });
  };

  const handleTagClose = (fieldKey: string, option: string) => {
    setDraft((prev) => {
      const next = cloneSelection(fields, prev);
      next[fieldKey] = (next[fieldKey] ?? []).filter((item) => item !== option);
      return next;
    });
  };

  const firstLevelOptions = primaryOptions[activeFieldKey] ?? [];
  const filteredFirstLevel = useMemo(() => {
    const keyword = firstLevelSearch.trim().toLowerCase();
    if (!keyword) {
      return firstLevelOptions;
    }
    return firstLevelOptions.filter((item) => item.toLowerCase().includes(keyword));
  }, [firstLevelOptions, firstLevelSearch]);

  const activeParent = activeParents[activeFieldKey] ?? null;
  const secondLevelOptions = activeParent
    ? childrenOptions[activeFieldKey]?.[activeParent] ?? []
    : [];

  const selectedSummary = useMemo(() => {
    return fields.flatMap((field) =>
      (draft[field.key] ?? []).map((option) => ({
        key: `${field.key}-${option}`,
        fieldKey: field.key,
        label: `${field.label} · ${option}`,
        option,
      })),
    );
  }, [draft, fields]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative flex h-[82vh] w-[92vw] max-w-6xl overflow-hidden rounded-[32px] bg-[#1F2430] text-white shadow-2xl ring-1 ring-black/40">
        <button
          type="button"
          aria-label="关闭筛选"
          onClick={handleClose}
          className="absolute right-6 top-6 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-gray-200 transition hover:bg-white/20"
        >
          <CloseOutlined />
        </button>

        <aside className="flex w-64 flex-col border-r border-white/10 bg-white/5">
          <div className="flex items-center px-6 py-4 text-lg font-semibold text-white/80">筛选条件</div>
          <nav className="flex-1 space-y-1 overflow-y-auto px-2 pb-6">
            {fields.map((field) => {
              const active = field.key === activeFieldKey;
              return (
                <div
                  key={field.key}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveFieldKey(field.key)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setActiveFieldKey(field.key);
                    }
                  }}
                  className={`w-full cursor-pointer rounded-2xl px-5 py-3 text-sm transition ${
                    active
                      ? 'bg-white/15 text-white shadow-inner'
                      : 'text-white/60 hover:bg-white/10 hover:text-white/90'
                  }`}
                >
                  {field.label}
                </div>
              );
            })}
          </nav>
        </aside>

        <section className="flex flex-1 flex-col">
          <header className="border-b border-white/10 px-8 py-6">
            <h2 className="text-xl font-semibold text-white">{activeField.label}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedSummary.length > 0 ? (
                selectedSummary.map((item) => (
                  <Tag
                    key={item.key}
                    closable
                    onClose={(event) => {
                      event.preventDefault();
                      handleTagClose(item.fieldKey, item.option);
                    }}
                    className="bg-white/15 text-white"
                    closeIcon={<span className="text-white/80">×</span>}
                  >
                    {item.label}
                  </Tag>
                ))
              ) : (
                <span className="text-xs text-white/40">暂无已选筛选项</span>
              )}
            </div>
          </header>

          <div className="flex flex-1 gap-6 overflow-hidden px-8 py-6 custom-scrollbar-container">
            <div className="flex w-64 shrink-0 flex-col rounded-3xl bg-white/5 p-5">
              <Input
                value={firstLevelSearch}
                onChange={(event) => setFirstLevelSearch(event.target.value)}
                allowClear
                placeholder="搜索分类"
              />
              <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                {loading ? (
                  <div className="flex h-full items-center justify-center">
                    <Spin tip="加载中" />
                  </div>
                ) : filteredFirstLevel.length > 0 ? (
                  filteredFirstLevel.map((option) => {
                    const active = option === activeParent;
                    return (
                      <div
                        key={option}
                        role="button"
                        tabIndex={0}
                        className={`w-full cursor-pointer rounded-2xl px-4 py-2 text-sm transition ${
                          active
                            ? 'bg-white text-gray-900 shadow'
                            : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
                        }`}
                        onClick={() => {
                          void handleParentClick(option);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            void handleParentClick(option);
                          }
                        }}
                      >
                        {option}
                      </div>
                    );
                  })
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-white/50">
                    暂无数据
                  </div>
                )}
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col rounded-3xl bg-white/5 p-5">
              {childrenLoading ? (
                <div className="mb-4 flex justify-end text-white/70">
                  <Spin size="small" />
                </div>
              ) : null}
              <div className="custom-scrollbar flex-1 overflow-y-auto pr-1">
                {activeParent ? (
                  secondLevelOptions.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {secondLevelOptions.map((option) => {
                        const selected = draft[activeFieldKey]?.includes(option);
                        return (
                          <div
                            key={option}
                            role="button"
                            tabIndex={0}
                            className={`rounded-full px-5 py-2 text-sm transition ${
                              selected
                                ? 'bg-white text-gray-900 shadow'
                                : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
                            }`}
                            onClick={() => handleChildToggle(option)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                handleChildToggle(option);
                              }
                            }}
                          >
                            {option}
                          </div>
                        );
                      })}
                    </div>
                  ) : childrenLoading ? (
                    <div className="flex h-full items-center justify-center text-sm text-white/60">
                      加载中...
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-white/60">
                      暂无子类
                    </div>
                  )
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-white/60">
                    请选择左侧的第一层分类
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-white/10 px-8 py-4">
            <Button onClick={handleReset} className="min-w-[84px]">
              重置
            </Button>
            <Button type="primary" onClick={handleApply} className="min-w-[84px]">
              应用
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default FilterModal;
