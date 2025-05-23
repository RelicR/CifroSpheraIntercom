import React, {Dispatch, SetStateAction, useEffect} from "react";
import {apiAuth, setAuthForInterceptor} from '../utils/axiosConfig'
import {useAccessTokenState} from "../providers/AuthContext";

type Props = {
    isOpen: boolean;
    setOpen: (Dispatch<SetStateAction<boolean>>);
}
export const ModalProfile = (props: Props) => {
    const context = useAccessTokenState();
    const {getMyProfile} = context;

    useEffect(() => {
        setAuthForInterceptor(context);
    }, [context]);

    const handleLogout = async () => {
        let toLogout = confirm('Вы действительно хотите выйти?');
        //alert(toLogout);
        if (toLogout) {
            const resp = await apiAuth.post('/logout').then(
                function (response) {
                    return {message: response.data.message, status: true};
                }, function (error) {
                    console.log(error);
                    return {message: error.message, status: false};
                }
            )
            console.log(resp);
            window.location.reload();
        }
    };

    return (
        <div className={"modal-window"} hidden={!props.isOpen}>
            <div className="modal-content">
                <h2 className={"w-full text-center"}>Профиль</h2>
                <div className={"modal-form"}>
                    <div className="space-y-3 w-full">
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex-1 w-full">
                                <label className={"block mb-1 text-sm"}>Отображаемое имя</label>
                                <p className={"w-full"}>{getMyProfile()!.display_name}</p>
                            </div>
                            {/*<div className="flex-1 w-full">*/}
                            {/*    <label className={"block mb-1"}>Отделы</label>*/}
                            {/*    <p className={"announcement-content"}>*/}
                            {/*        {getMyProfile()!.department}*/}
                            {/*    </p>*/}
                            {/*</div>*/}
                            <div className="flex-1 w-full">
                                <label className={"block mb-1 text-sm"}>Роль</label>
                                <p className={"w-full"}>{getMyProfile()!.role}</p>
                            </div>
                        </div>
                    </div>
                    <div className={"side-section flex w-full gap-2 justify-between mt-2"}>
                        <button type={"submit"} className="rounded-button w-full decline"
                                onClick={(e) => handleLogout()}>
                            Выход
                        </button>
                        <button className="rounded-button w-full" onClick={(e) => props.setOpen(false)}>
                            Отмена
                        </button>
                    </div>
                </div>
            </div>
            <div className="modal-closing" onClick={() => props.setOpen(false)}>
            </div>
        </div>
    );
};
