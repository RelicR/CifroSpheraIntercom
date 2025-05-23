import React, {useEffect, useReducer, useState} from 'react';
import {useAccessTokenState} from "../providers/AuthContext";
import {api, setAuthForInterceptor} from '../utils/axiosConfig'
import {IDepProfile, IUserProfile} from "../../types/generalTypes";

type Props = {
    parentCallback: (childData: IUserProfile[] | IDepProfile[]) => void;
    mode: "single" | "multiple";
    target?: string;
    defaultUser?: IUserProfile | null;
    listType?: string;
};

type Action = {
    type: string;
    user?: IUserProfile;
    dep?: IDepProfile;
}

// export const Dropdown: React.FC = () => {
export function Dropdown(props: Props) {
    const [searchInput, setSearchInput] = useState<string>('');
    const [selected, dispatchSelected] = useReducer(selectedReducer, []);
    const [selectedDep, dispatchSelectedDep] = useReducer(selectedDepReducer, []);
    const [users, setUsers] = useState<IUserProfile[]>([]);
    const [departments, setDepartments] = useState<IDepProfile[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<IUserProfile[]>([]);
    const [filteredDeps, setFilteredDeps] = useState<IDepProfile[]>([]);
    const [isSearch, setIsSearch] = useState<boolean>(false);
    const context = useAccessTokenState();
    const {refreshAccessToken, getAccessToken, accessTokenRef, userId} = context;

    if (props.listType && props.listType == 'department') {
        useEffect(() => {
            setAuthForInterceptor(context);
            getDepartments().then(() => {
                setFilteredDeps(departments);
                console.log('Got departments');
            });
        }, [context]);

        useEffect(() => {
            dispatchSelectedDep({
                type: `select-clear`
            });
            setSearchInput('');
        }, [props.mode]);

        useEffect(() => {
            console.log('Filtering departments');
            setFilteredDeps(departments.filter(function (dep) {
                return dep.department_name!.toLowerCase().includes(searchInput);
            }));
        }, [searchInput]);

        useEffect(() => {
            if (departments) {
                console.log('Filtering departments with deps update');
                setFilteredDeps(departments.filter(function (dep) {
                    return dep.department_name!.toLowerCase().includes(searchInput);
                }));
            }
        }, [departments]);

        useEffect(() => {
            props.parentCallback(selectedDep);
        }, [selectedDep]);
    } else {
        useEffect(() => {
            setAuthForInterceptor(context);
            getUsers().then(() => {
                setFilteredUsers(users);
                console.log('Got users');
            });
        }, [context]);

        useEffect(() => {
            dispatchSelected({
                type: `select-clear`
            });
            setSearchInput('');
        }, [props.mode]);

        useEffect(() => {
            console.log('Filtering users');
            setFilteredUsers(users.filter(function (user) {
                return user.display_name!.toLowerCase().includes(searchInput);
            }));
        }, [searchInput]);

        useEffect(() => {
            if (users) {
                console.log('Filtering users with users update');
                setFilteredUsers(users.filter(function (user) {
                    return user.display_name!.toLowerCase().includes(searchInput);
                }));
            }
        }, [users]);

        useEffect(() => {
            props.parentCallback(selected);
        }, [selected]);
    }

    function selectedReducer(list: IUserProfile[], action: Action): IUserProfile[] {
        if (!action.user) return [];
        switch (action.type) {
            case 'select-single': {
                return [action.user];
            }
            case 'select-multiple': {
                return !list.includes(action.user) ? [...list, action.user] : list;
            }
            case 'deselect': {
                return list.includes(action.user) ? list.toSpliced(list.indexOf(action.user), 1) : list;
            }
            case 'clear': {
                return [];
            }
            default: {
                return list;
            }
        }
    }

    function selectedDepReducer(list: IDepProfile[], action: Action): IDepProfile[] {
        console.log('Dep action:', action);
        if (!action.dep) return [];
        switch (action.type) {
            case 'select-single': {
                return [action.dep];
            }
            case 'select-multiple': {
                return !list.includes(action.dep) ? [...list, action.dep] : list;
            }
            case 'deselect': {
                return list.includes(action.dep) ? list.toSpliced(list.indexOf(action.dep), 1) : list;
            }
            case 'clear': {
                return [];
            }
            default: {
                return list;
            }
        }
    }

    const clickItem = (user?: IUserProfile, dep?: IDepProfile) => {
        console.log(user);
        if (props.listType == 'department') {
            console.log('Dispatching deps');
            dispatchSelectedDep({
                type: `select-${props.mode}`,
                dep: dep,
            });
        } else {
            dispatchSelected({
                type: `select-${props.mode}`,
                user: user,
            });
        }
        setSearchInput('');
        console.log(selected);
    }

    const clickSelectedItem = (user?: IUserProfile, dep?: IDepProfile) => {
        console.log(dep as IDepProfile);
        if (props.listType == 'department') {
            console.log('Dispatching selected deps');
            dispatchSelectedDep({
                type: `deselect`,
                dep: dep as IDepProfile,
            });
        } else {
            dispatchSelected({
                type: `deselect`,
                user: user,
            });
        }
        console.log(selected);
    }

    const getUsers = async () => {
        const resp: IUserProfile[] = await api.get(`/users`).then(
            function (response) {
                return response.data;
            }, function (error) {
                console.log(error);
            }
        );
        console.log(`Resp is ${resp}`);
        //setUsers(resp.filter((user: IUser) => user._id != userId));
        setUsers(resp);
        console.log(resp);
        console.log(users);
    }

    const getDepartments = async () => {
        const resp = await api.get(`/department/list?${props.target == 'service' ? "target=service" : "mode=manage"}`).then(
            function (response) {
                return response.data;
            }, function (error) {
                console.log(error);
            }
        );
        console.log(resp);
        console.log(resp);
        console.log(departments);
        console.log(departments.length);
        setDepartments(resp)
    }

    const handleSearch = (value: string) => {
        setSearchInput(value.toLowerCase());
        console.log(filteredUsers);
        console.log('HandleSearch invoked');
    }
    // (props.listType && props.listType == 'department')
    return (props.listType == 'department') ? (
        <div className={"dropdown-content"}>
            {selectedDep.length > 0 && (
                <div className={"dropdown-selected-list"}>
                    {selectedDep.map((dep) => (
                        <div
                            className={"rounded-button user"}
                            key={dep._id}
                            onClick={(e) => clickSelectedItem(undefined, dep)}>
                            {dep.department_name}
                        </div>
                    ))}
                </div>
            )}
            <div className={"dropdown-content"}>
                <input
                    type={"text"}
                    value={searchInput}
                    placeholder={"Поиск"}
                    className={"modal-input"}
                    onChange={(e) => handleSearch(e.target.value)}
                    onClick={(e) => setIsSearch(!isSearch)}
                    onBlur={() => setTimeout(() => {
                        setIsSearch(false)
                    }, 200)}
                />
                {isSearch && (
                    <div className={"users-selection"}>
                        {filteredDeps.length > 0 ? (
                            <div className={"users-selection-list"}>
                                {filteredDeps.map((dep) => (
                                    <div
                                        key={dep._id}
                                        className={"users-selection-item"}
                                        onClick={(e) => clickItem(undefined, dep)}>
                                        {dep.department_name}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div>Не найдено</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    ) : (
        <div className={"dropdown-content"}>
            {selected.length > 0 && (
                <div className={"dropdown-selected-list"}>
                    {selected.map((user) => (
                        <div
                            className={"rounded-button user"}
                            key={user._id}
                            onClick={(e) => clickSelectedItem(user)}>
                            {user.display_name}
                        </div>
                    ))}
                </div>
            )}
            <div className={"dropdown-content"}>
                <input
                    type={"text"}
                    value={searchInput}
                    placeholder={"Поиск"}
                    className={"modal-input"}
                    onChange={(e) => handleSearch(e.target.value)}
                    onClick={(e) => setIsSearch(!isSearch)}
                    onBlur={() => setTimeout(() => {
                        setIsSearch(false)
                    }, 200)}
                />
                {isSearch && (
                    <div className={"users-selection"}>
                        {filteredUsers.length > 0 ? (
                            <div className={"users-selection-list"}>
                                {filteredUsers.map((user) => (
                                    <div
                                        key={user._id}
                                        className={"users-selection-item"}
                                        onClick={(e) => clickItem(user)}>
                                        {user.display_name}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div>Не найдено</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}