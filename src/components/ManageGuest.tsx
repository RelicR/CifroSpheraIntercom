import React, {useEffect, useState} from 'react';
import {useAccessTokenState} from "../providers/AuthContext";
import {api, setAuthForInterceptor} from '../utils/axiosConfig'
import {IGuest} from "../../types/generalTypes";
import {ModalGuest} from "./ModalGuest";

export const ManageGuest: React.FC = () => {
    const [isNewGuest, setIsNewGuest] = useState(false);
    const [guests, setGuests] = useState<IGuest[]>([]);
    const context = useAccessTokenState();
    const {getAccess} = context;


    useEffect(() => {
        setAuthForInterceptor(context);
        getGuests().then(() => console.log('Got guests'));
    }, [context]);

    const getGuests = async () => {
        const resp = await api.get('/users?mode=guests').then(
            function (response) {
                return response.data;
            }, function (error) {
                console.log(error);
            }
        );
        if (resp.length > 0) setGuests(resp);
        else setGuests([]);
        console.log(resp);
        console.log(guests);
        console.log(guests.length);
    }

    return (
        <div className="main-container justify-center">
            <main className={"main-window department"}>
                <div className={"flex items-center p-4 border-b border-gray-200"}>
                    <div className="flex-1">
                        <h1 className="text-xl font-semibold">Клиенты с гостевым доступом</h1>
                    </div>
                    <button onClick={(e) => setIsNewGuest(true)}>
                        Добавить клиента
                    </button>
                </div>
                <div className="department-list">
                    {guests?.map((guest, index) => (
                        <div
                            className="department-card"
                            key={index}>
                            <div className="flex items-start justify-between mb-3">
                                <div className={"flex items-center gap-3"}>
                                    <h3 className={"font-medium"}>
                                        {guest.user.display_name} | {guest.user._id}
                                    </h3>
                                </div>
                                <div>
                                    <>{guest.user.role}</>
                                </div>
                            </div>
                            <h2 className={"text-xl font-semibold mb-2"}>Данные входа</h2>
                            <div className={"flex items-start gap-3"}>
                                <h3 className={"font-medium"}>
                                    {guest.user.username}
                                </h3>
                                <h3 className={"font-medium"}>
                                    {guest.login_href}
                                </h3>
                            </div>
                            <h2 className={"text-xl font-semibold mb-2"}>Менеджеры</h2>
                            <div className={"flex items-start gap-3"}>
                                <p className={"department-members"}>
                                    {guest.manager && guest.manager!.map((mng, index) => (
                                        <React.Fragment key={index}>
                                            {mng.display_name}
                                            <br/>
                                        </React.Fragment>
                                    ))}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
            {isNewGuest && (
                <ModalGuest isOpen={isNewGuest} setOpen={setIsNewGuest} setCreated={(status) => {
                    if (status) getGuests();
                }}/>
            )}
        </div>
    )
}