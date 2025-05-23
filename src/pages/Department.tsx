import React, {useEffect, useState} from 'react';
import {useAccessTokenState} from "../providers/AuthContext";
import {api, setAuthForInterceptor} from '../utils/axiosConfig'
import {IDepartment} from "../../types/generalTypes";
import {ModalDepartment} from "../components/ModalDepartment";

export const Department: React.FC = () => {
    const [isNewDep, setIsNewDep] = useState(false);
    const [isEditDep, setIsEditDep] = useState(false);
    const [departments, setDepartments] = useState<IDepartment[]>([]);
    const context = useAccessTokenState();
    const {getAccess} = context;


    useEffect(() => {
        setAuthForInterceptor(context);
        getDepartment().then(() => console.log('Got departments'));
    }, [context]);

    const getDepartment = async () => {
        const resp = await api.get(`/department/list?mode=${getAccess() > 2 && "manage"}`).then(
            function (response) {
                return response.data;
            }, function (error) {
                console.log(error);
            }
        );
        if (resp.length > 0) setDepartments(resp);
        else setDepartments([]);
        console.log(resp);
        console.log(departments);
        console.log(departments.length);
    }


    return (
        <div className="main-container justify-center">
            <main className={"main-window department"}>
                <div className={"flex items-center p-4 border-b border-gray-200"}>
                    <div className="flex-1">
                        <h1 className="text-xl font-semibold">Отделы</h1>
                    </div>
                    {getAccess() > 3 && (
                        <button onClick={(e) => setIsNewDep(true)}>
                            Создать отдел
                        </button>
                    )}
                </div>
                <div className="department-list">
                    {departments?.map((department, index) => (
                        <div
                            className="department-card"
                            key={index}>
                            <div className="flex items-start justify-between mb-3">
                                <div className={"flex items-center gap-3"}>
                                    <h3 className={"font-medium"}>
                                        {department.department_name} | {department.short_name}
                                    </h3>
                                </div>
                                <div>
                                    <>{department.admin!.display_name}</>
                                </div>
                            </div>
                            <h2 className={"text-xl font-semibold mb-2"}>Сотрудники</h2>
                            <p className={"department-members"}>
                                {department.members_list.map((member, index) => (
                                    <React.Fragment key={index}>
                                        {member.display_name}
                                        <br/>
                                    </React.Fragment>
                                ))}
                            </p>
                        </div>
                    ))}
                </div>
            </main>
            {isNewDep && (
                <ModalDepartment isOpen={isNewDep} setOpen={setIsNewDep} setCreated={(status) => {
                    if (status) getDepartment();
                }}/>
            )}
        </div>
    )
}