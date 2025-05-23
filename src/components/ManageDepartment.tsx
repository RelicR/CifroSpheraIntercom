import React, {useEffect, useState} from 'react';
import {useAccessTokenState} from "../providers/AuthContext";
import {api, setAuthForInterceptor} from '../utils/axiosConfig'
import {IDepartment, IUserProfile} from "../../types/generalTypes";
import {Dropdown} from "./Dropdown";

type Props = {
    // depId: string;
    department: IDepartment;
}

export function ManageDepartment(props: Props) {
    const [input, setInput] = useState<string>('');
    const [curDept, setCurDept] = useState<string | null>(null);
    const [selected, setSelected] = useState<IUserProfile[]>([]);
    const [targetUserList, setTargetUserList] = useState<IUserProfile[]>([]);
    const [department, setDepartment] = useState<IDepartment>(props.department);
    const [depEmployees, setDepEmployees] = useState<IUserProfile[]>([]);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const context = useAccessTokenState();
    const {refreshAccessToken, getAccessToken, accessTokenRef, userId} = context;

    useEffect(() => {
        setAuthForInterceptor(context);
        // getDepartment().then(async () => {
        //     console.log('Department loaded');
        // });
        setDepartment(props.department);
        getEmployees().then(() => console.log('Got emps'));
    }, [context]);

    useEffect(() => {
        //setDepartment(props.department);
        getEmployees().then(() => console.log('Got emps'));
    }, [department]);

    // const getDepartment = async () => {
    //     console.log(props.depId);
    //     const resp = await api.get(`/department/list?depId=${props.depId}`).then(
    //         function (response) {
    //             return response.data;
    //         }, function (error) {
    //             console.log(error);
    //         }
    //     );
    //     setDepartment(resp);
    //     getEmployees().then(() => console.log('Department and emps loaded'));
    //     console.log(resp);
    //     console.log(department);
    // }

    const getEmployees = async () => {
        console.log('GetEmployees');
        console.log(department._id);
        const resp = await api.get(`/users?depId=${department._id}`).then(
            function (response) {
                return response.data;
            }, function (error) {
                console.log(error);
            }
        );
        setDepEmployees(resp);
        console.log(resp);
        console.log(department);
    }

    const handleUpdate = async () => {
        console.log(department, selected);
        const resp = await api.post(`/department/update`, {
            department_id: department?._id,
            members_list: selected.map((user) => {
                return user._id
            }),
        }).then(
            function (response) {
                return response.data;
            }, function (error) {
                console.log(error);
            }
        );
        console.log(resp);
        setIsOpen(false);

        //setDepartment(resp);
        // let updDepartment: IDepartment = department!;
        // updDepartment.members_list =
        //     updDepartment.members_list.concat(targetUserList.map((user) => {return user._id}));
        // console.log(targetUserList.map((user) => {return user._id}));
        // console.log(updDepartment);
    }

    const handleCallback = (childData: IUserProfile[]) => {
        console.log('Child data: ', childData);
        setSelected(childData);
    }

    return (
        <div className="department-item">
            {department != null ? (
                <div className={"department-info"}>
                    <div className={"department-name"} onClick={() => {
                        setIsOpen(!isOpen);
                    }}>
                        <p>{department.department_name} ({department.short_name})</p>
                    </div>
                    {isOpen && (
                        <div className="department-employees">
                            <p>Admin: {department.admin.display_name}</p>
                            {depEmployees.map((employee: IUserProfile) => (
                                <div key={employee._id}>{employee.display_name}</div>
                            ))}
                            <Dropdown parentCallback={handleCallback} mode={'multiple'}/>
                            <br/>
                            <button value={"Сохранить"} onClick={handleUpdate}>Сохранить</button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="department-none">
                    Ошибка получения информации
                </div>
            )}
        </div>
    );
}