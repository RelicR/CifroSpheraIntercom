import React, {createContext, FC, ReactNode, RefObject, useEffect, useMemo, useRef, useState} from 'react';
import {api, apiAuth} from "../utils/axiosConfig";
import {IUser, UserRoles} from "../../types/generalTypes"

export interface AuthContextType {
    accessToken: string | null,
    refreshAccessToken: () => Promise<string | null>,
    userId: string | null,
    saveAccessToken: (token: string | null) => void,
    getAccessToken: () => string | null,
    accessTokenRef: RefObject<string | null>,
    getLoggedState: () => boolean,
    getMyProfile: () => IUser | null,
    getAccess: () => number,
    setServerError: (isError: boolean, isSuccess: boolean, message: string) => void,
    serverError: RefObject<{
        isError: boolean
        isSuccess: boolean
        message: string
    }>,
}

//export const AuthContext = createContext(null);

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: FC<{ children: ReactNode }> = ({children}) => {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [update, setUpdate] = useState<boolean | null>(false);
    // const [serverError, setError] = useState<{ isError: boolean, message: string }>({ isError: false, message: '' });
    const serverError = useRef({isError: false, isSuccess: false, message: ''})
    const myProfileRef = useRef<IUser | null>(null);
    const accessTokenRef: RefObject<string | null> = useRef(null);
    accessTokenRef.current = accessToken;

    const saveAccessToken = (token: string | null) => {
        setAccessToken(token);
    }

    const getAccessToken = () => {
        return accessToken;
    }

    const getLoggedState = (): boolean => {
        console.log('Checking logged state: ', accessToken != null);
        return accessToken != null;
    }

    const refreshAccessToken = async () => {
        console.log('Refreshing access token');
        try {
            const resp = await apiAuth.get('/refresh').then(
                function (response) {
                    return response.data;
                }, function (error) {
                    console.log(error);
                }
            );
            // const response = await fetch(`http://localhost:5001/api/refresh`, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     credentials: 'include'
            // });
            console.log('Got refresh access token in Context');
            console.log(resp);
            //const data = await response.json();
            //console.log(data);
            if (!resp.cat_acst) {
                throw new Error("No token provided from server");
            }
            setAccessToken(resp.cat_acst);
            setUserId(resp.cat_uid);
            console.log(resp.cat_acst);
            console.log(accessToken);
            await api.get('/users?mode=myInfo').then(
                function (response) {
                    myProfileRef.current = response.data;
                },
                function (error) {
                    console.log(error);
                }
            )
        } catch (err) {
            setAccessToken(null);
            console.log(serverError);
        }
        return (accessTokenRef.current);
    };

    const setUpdater = () => {
        setUpdate(true);
    }

    const getMyProfile = () => {
        return myProfileRef.current;
    }

    const getAccess = () => {
        if (myProfileRef.current) {
            console.log('Checking access level on', myProfileRef.current.role);
            switch (myProfileRef.current.role) {
                case UserRoles.Guest:
                    return 1;
                case UserRoles.Staff:
                    return 2;
                case UserRoles.HeadOfDepartment:
                    return 3;
                default:
                    return 4;
            }
        } else return 0;
    }

    const setServerError = (isError: boolean, isSuccess: boolean, message: string) => {
        console.log('Setting server message in context with params:', isError, isSuccess, message);
        serverError.current = {isError: isError, isSuccess: isSuccess, message: message};
    }

    useEffect(() => {
        // refreshAccessToken().catch((err) => console.log(err));
        console.log('Invoked setInterval on accessToken');
        console.log(accessToken);
        const interval = setInterval(refreshAccessToken, 14 * 60 * 1000); // Обновляем каждые 14 минут
        return () => clearInterval(interval);
    }, [accessToken]);

    const value = useMemo(() => ({
        accessToken,
        refreshAccessToken,
        saveAccessToken,
        getAccessToken,
        accessTokenRef,
        userId,
        getLoggedState,
        getMyProfile,
        getAccess,
        setServerError,
        serverError
    }), [accessToken]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export function useAccessTokenState() {
    const context = React.useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAccessTokenState must be used within a AuthProvider')
    }
    return context as AuthContextType;
}