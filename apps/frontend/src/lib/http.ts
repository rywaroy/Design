import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import type { AxiosRequestHeaders, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';

export interface ApiResponse<T = unknown> {
  data: T;
  code: number;
  message: string;
}

export class ApiException<T = unknown> extends Error {
  code?: number;
  response?: AxiosResponse<ApiResponse<T>>;

  constructor(
    message: string,
    response?: AxiosResponse<ApiResponse<T>>,
    code?: number,
  ) {
    super(message);
    this.name = 'ApiException';
    this.response = response;
    this.code = code ?? response?.data?.code;
  }
}

type TokenResolver = () => string | null | undefined;

let resolveToken: TokenResolver = () => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    return window.localStorage?.getItem('accessToken') ?? undefined;
  } catch {
    return undefined;
  }
};

export const setTokenResolver = (resolver: TokenResolver) => {
  resolveToken = resolver;
};

const baseURL = (import.meta.env?.VITE_API_BASE as string | undefined) || '/api';
const DEFAULT_TIMEOUT = 60000;
const ERROR_MESSAGE_KEY = 'global-http-error';

const httpClient: AxiosInstance = axios.create({
  baseURL,
  timeout: DEFAULT_TIMEOUT,
  withCredentials: true,
});

const showErrorMessage = (content: string) => {
  if (!content) {
    return;
  }

  message.error({
    key: ERROR_MESSAGE_KEY,
    content,
  });
};

const attachAuthorization = (
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig => {
  const token = resolveToken?.();
  if (token) {
    if (!config.headers) {
      config.headers = {} as AxiosRequestHeaders;
    }

    if (typeof (config.headers as any).set === 'function') {
      (config.headers as any).set('Authorization', `Bearer ${token}`);
    } else {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  }

  return config;
};

// 统一解析后端返回的格式，并在业务失败时抛出自定义异常
const transformSuccess = <T>(
  response: AxiosResponse<ApiResponse<T>>,
): ApiResponse<T> => {
  const payload = response.data;

  if (payload?.code === 0) {
    return payload;
  }

  const errorMessage = payload?.message ?? '请求失败';
  showErrorMessage(errorMessage);
  throw new ApiException<T>(errorMessage, response, payload?.code);
};

const transformFailure = (error: AxiosError<ApiResponse<unknown>>) => {
  if (error.response) {
    const payload = error.response.data;
    let errorMessage = '请求失败';
    let errorCode: number | undefined;

    if (payload && typeof payload === 'object') {
      const apiPayload = payload as Partial<ApiResponse<unknown>> & {
        error?: string;
      };
      errorMessage =
        apiPayload.message ?? apiPayload.error ?? error.response.statusText ?? errorMessage;
      if (typeof apiPayload.code === 'number') {
        errorCode = apiPayload.code;
      }
    } else if (typeof payload === 'string') {
      errorMessage = payload;
    } else if (error.response.status === 401) {
      errorMessage = '登录信息已失效，请重新登录';
    }

    if (error.response.status === 401) {
      errorMessage = '登录信息已失效，请重新登录';
    }

    showErrorMessage(errorMessage);

    throw new ApiException(
      errorMessage,
      error.response as AxiosResponse<ApiResponse<unknown>>,
      errorCode,
    );
  }

  if (error.request) {
    const networkErrorMessage = '网络异常，请稍后重试';
    showErrorMessage(networkErrorMessage);
    throw new Error(networkErrorMessage);
  }

  const unexpectedErrorMessage = error.message || '请求异常';
  showErrorMessage(unexpectedErrorMessage);
  throw error;
};

httpClient.interceptors.request.use(attachAuthorization);
httpClient.interceptors.response.use(transformSuccess, transformFailure);

export const request = <T = unknown>(
  config: AxiosRequestConfig,
): Promise<ApiResponse<T>> => {
  return httpClient.request<ApiResponse<T>, ApiResponse<T>>(config);
};

export default httpClient;
