import axios, {AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig} from 'axios';
import {AuthContextType} from "../providers/AuthContext";
require('dotenv').config();

const {SERVER_PORT, AUTH_PORT, HOST_URL} = process.env;
// const context = useAccessTokenState();
// const {accessTokenRef} = context;

const ERROR_DESCRIPTION: { [key: string]: string } = {
    ERR_NETWORK: "Ошибка соединения с сервером.",
    ERR_BAD_RESPONSE: "Ошибка получения данных с сервера.",
    ERR_BAD_REQUEST: "Ошибка отправки данных на сервер.",
    ETIMEDOUT: "Превышено время ожидания.",
    ERR_INVALID_URL: "Неверный адрес запроса."
}

let currentAuth: AuthContextType;
export const setAuthForInterceptor = (auth: AuthContextType) => {
    currentAuth = auth;
};

let isRefreshing = false;
let failedRequestsQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: AxiosError) => void;
}> = [];

export const api: AxiosInstance = axios.create({
    baseURL: `${HOST_URL}:${SERVER_PORT}/api`,
    headers: {"Content-Type": "application/json"},
    withCredentials: true,
});

api.interceptors.request.use(
    function (config: InternalAxiosRequestConfig) {
        if (!currentAuth?.accessToken) {
            console.log('AccessToken is missing in request');
            currentAuth.refreshAccessToken();
            return config;
        }
        console.log(`Request accessToken: ${currentAuth.accessToken}`);
        config.headers.Authorization = `Bearer ${currentAuth.accessToken}`;

        return config;
    },
    function (error: AxiosError) {
        console.log('Request error:');
        console.log(error);
        if (error) {
            console.log('setting error for context');
            if (error.status == 401) {
                currentAuth.setServerError(true, false, "Вы не авторизованы.\nЗарегистрируйтесь или войдите в аккаунт");
            } else if (error.status == 400) {
                currentAuth.setServerError(true, false, "Были отправлены неверные данные.");
            } else {
                currentAuth.setServerError(true, false, ERROR_DESCRIPTION[error.code!.toString()]);
            }
        }
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    function (response: AxiosResponse) {
        console.log(`Got a response ${response}`);
        if (response.status == 200 && response.data.message) {
            currentAuth.setServerError(false, true, response.data.message);
        }
        return response;
    },
    async function (error: AxiosError) {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        console.log(`Got an error with response ${originalRequest}`);
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            if (!isRefreshing) {
                isRefreshing = true;

                try {
                    const newAccessToken = await currentAuth.refreshAccessToken();
                    if (newAccessToken == null) {
                        throw new Error('Refresh token is missing');
                    }
                    // Retry all queued requests with new token
                    failedRequestsQueue.forEach(({resolve}) =>
                        resolve(newAccessToken));
                    failedRequestsQueue = [];

                    // Update authorization header and retry original request
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    }
                    return api(originalRequest);
                } catch (refreshError) {
                    console.log('Refresh error:', refreshError);
                    // Refresh failed - clear auth and reject queued requests
                    failedRequestsQueue.forEach(({reject}) => reject(refreshError as AxiosError));
                    failedRequestsQueue = [];
                    currentAuth.saveAccessToken(null);
                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
                if (error) {
                    console.log('setting error for context');
                    if (error.status == 401) {
                        currentAuth.setServerError(true, false, "Вы не авторизованы.\nЗарегистрируйтесь или войдите в аккаунт");
                    } else if (error.status == 400) {
                        currentAuth.setServerError(true, false, "Были отправлены неверные данные.");
                    } else {
                        currentAuth.setServerError(true, false, ERROR_DESCRIPTION[error.code!.toString()]);
                    }
                }
            }

            // If token is being refreshed, queue the request
            return new Promise((resolve, reject) => {
                failedRequestsQueue.push({
                    resolve: (token: string) => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        resolve(api(originalRequest));
                    },
                    reject: (err: AxiosError) => {
                        console.log('Rejected promise:', err);
                        reject(err);
                    },
                });
            });
        }

        return Promise.reject(error);
    }
);


export const apiAuth: AxiosInstance = axios.create({
    baseURL: `${HOST_URL}:${AUTH_PORT}/api`,
    headers: {"Content-Type": "application/json"},
    withCredentials: true,
});

apiAuth.interceptors.request.use(
    function (config: InternalAxiosRequestConfig) {
        if (!currentAuth?.accessToken) {
            console.log('AccessToken is missing in Auth request');
            return config;
        }
        console.log(`Auth request accessToken: ${currentAuth.accessToken}`);
        config.headers.Authorization = `Bearer ${currentAuth.accessToken}`;

        return config;
    },
    function (error: AxiosError) {
        console.log('Auth request error:');
        console.log(error);
        return Promise.reject(error);
    }
);

apiAuth.interceptors.response.use(
    function (response: AxiosResponse) {
        console.log('Got an Auth response');
        console.log(response);
        return response;
    },
    async function (error: AxiosError) {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        console.log('Got an error with Auth response');
        console.log(originalRequest);
        console.log(error);
        console.log(error && error.code);
        if (error) {
            console.log('setting error for context');
            if (error.status == 401) {
                currentAuth.setServerError(true, false, "Вы не авторизованы.\nЗарегистрируйтесь или войдите в аккаунт");
            } else if (error.status == 400) {
                currentAuth.setServerError(true, false, "Были отправлены неверные данные.");
            } else {
                currentAuth.setServerError(true, false, ERROR_DESCRIPTION[error.code!.toString()]);
            }
        }
        originalRequest._retry = false;
        if (error.response?.status === 401) {
            console.log('Invalid credentials for Auth request');
            //window.location.replace('/login');
        }
        if (error.response?.status === 400) {
            console.log('Bad request');
            //window.location.replace('/login');
        }
        return Promise.reject(error);
    }
);


// api.interceptors.response.use(
//     function (response: AxiosResponse) {
//         return response;
//     },
//     async function (error: AxiosError) {
//         const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
//
//         if (error.response?.status === 401 && !originalRequest._retry) {
//             originalRequest._retry = true;
//
//             if (!isRefreshing) {
//                 isRefreshing = true;
//
//                 try {
//                     const newAccessToken = await currentAuth.refreshAccessToken();
//
//                     // Retry all queued requests with new token
//                     failedRequestsQueue.forEach(({ resolve }) => resolve(newAccessToken));
//                     failedRequestsQueue = [];
//
//                     // Update authorization header and retry original request
//                     if (originalRequest.headers) {
//                         originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
//                     }
//                     return api(originalRequest);
//                 } catch (refreshError) {
//                     // Refresh failed - clear auth and reject queued requests
//                     failedRequestsQueue.forEach(({ reject }) => reject(refreshError as AxiosError));
//                     failedRequestsQueue = [];
//                     currentAuth.setAccessToken(null);
//                     return Promise.reject(refreshError);
//                 } finally {
//                     isRefreshing = false;
//                 }
//             }
//
//             // If token is being refreshed, queue the request
//             return new Promise((resolve, reject) => {
//                 failedRequestsQueue.push({
//                     resolve: (token: string) => {
//                         if (originalRequest.headers) {
//                             originalRequest.headers.Authorization = `Bearer ${token}`;
//                         }
//                         resolve(api(originalRequest));
//                     },
//                     reject: (err: AxiosError) => {
//                         reject(err);
//                     },
//                 });
//             });
//         }
//
//         return Promise.reject(error);
//     }
// );


// const apiSecure: AxiosInstance = axios.create({
//     baseURL: 'http://localhost:5001/api',
//     withCredentials: true,
//     headers: {"Content-Type": "application/json"},
// });
//
// api.interceptors.request.use(function (config) {
//     // Do something before request is sent
//     config.headers["Authorization"] = "Bearer " + accessTokenRef.current;
//     console.log('Interceptor changed Auth header');
//     return config;
// }, function (error) {
//     // Do something with request error
//     console.log('Interceptor caught an error ', error);
//     return Promise.reject(error);
// });


// function intercept(request: InternalAxiosRequestConfig) {
//     if (accessTokenRef.current) {
//         request.auth = {
//             token: accessTokenRef.current,
//         };
//     }
//     return request;
// }
//
// apiSecure.interceptors.request.use(intercept);
//
// function apiSetToken (token: string | null): void {
//     if (token) {
//         api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//     }
// }
//
// if (accessTokenRef.current) {
//     apiSetToken(accessTokenRef.current);
// }
//
// // function beforeRequest
//
// api.interceptors.request.use(config => {
//
//     if(!config.defaults.headers.common['Authorization']) {
//
//     }
// });