import React, {Dispatch, SetStateAction, useEffect, useRef} from "react";
import {useForm} from 'react-hook-form';
import {Dropdown} from "./Dropdown";
import {ChatType, IDepartment, IUserProfile} from "../../types/generalTypes";
import {api, apiAuth, setAuthForInterceptor} from "../utils/axiosConfig";
import {useAccessTokenState} from "../providers/AuthContext";

type Props = {
    isOpen: boolean;
    setOpen: (Dispatch<SetStateAction<boolean>>);
    setCreated: (status: boolean) => void;
    baseSubject?: IDepartment;
    mode?: string;
}

export const ModalGuest = (props: Props) => {
    const mngRef = useRef<IUserProfile[]>([]);
    const context = useAccessTokenState();
    const {getAccess, getMyProfile} = context;
    const {
        register, resetField, reset, setError, clearErrors, getValues, setValue, handleSubmit,
        formState: {errors, touchedFields, isValid}
    } = useForm({
        defaultValues: {
            guestFName: '',
            guestLName: '',
        },
        mode: 'onChange',
    });

    useEffect(() => {
        setAuthForInterceptor(context);
        // myRef.current = getMyProfile();
    }, [context]);

    const onSubmit = async (data: Object) => {
        const {guestFName, guestLName} = getValues();
        console.log(data);
        console.log(isValid);
        console.log(touchedFields);
        console.log(mngRef);
        console.log(mngRef.current.map((m) => m._id));
        if (isValid && mngRef.current.length > 0) {
            const resp = await apiAuth.post('/register?mode=guest', {
                firstName: guestFName,
                lastName: guestLName
            }).then(
                function (response) {
                    return {data: response.data, status: true};
                }, function (error) {
                    console.log(error);
                    return {data: error.data, status: false};
                }
            )
            console.log(resp);
            if (resp.status) {
                await api.post('/chats/create?mode=guest', {
                    chat_name: `ITC ${guestFName} ${guestLName}`,
                    chat_type: ChatType.Group,
                    members_list: mngRef.current.map((m) => m._id).concat(resp.data.guestId),
                    guestId: resp.data.guestId,
                }).then(
                    function (response) {
                        alert('Пользователь и чат созданы');
                        props.setCreated(true);
                        props.setOpen(false);
                        return {data: response.data, status: true};
                    }, function (error) {
                        console.log(error);
                        return {data: error.data, status: false};
                    }
                )
            }
        }
    }

    // const handleSingleCallback = (childData: IUserProfile[]) => {
    //     // clearErrors("depHod");
    //     console.log('Child data single: ', childData);
    //     mngRef.current = childData[0];
    //     console.log(mngRef.current, !!mngRef.current);
    //     console.log('Errors:', errors);
    //     console.log(isValid);
    //     // if (!hodRef.current) setError("depHod", {type:"custom", message:"По умолчанию Вы будете главой отдела"});
    // }

    const handleMultCallback = (childData: IUserProfile[]) => {
        console.log('Child data multiple: ', childData);
        mngRef.current = childData;
        console.log(mngRef.current);
    }

    return (
        <div className={"modal-window"} hidden={!props.isOpen}>
            <div className="modal-content">
                <h2 className={"w-full text-center"}>Гостевой доступ</h2>
                <form className={"modal-form"} onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-3 w-full">
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex-1 w-full">
                                <label className={"block text-xl mb-1"}>Имя</label>
                                <input type="text" id="guestFName" className="text-sm w-full"
                                       {...register("guestFName", {required: "Введите имя клиента"})}/>
                                {errors.guestFName && (
                                    <span className={"error-span"}>{errors.guestFName.message}</span>)}
                            </div>
                            <div className="flex-1 w-full">
                                <label className={"block text-xl mb-1"}>Фамилия</label>
                                <input type="text" id="guestLName" className="text-sm w-full"
                                       {...register("guestLName", {required: "Введите фамилию клиента"})}/>
                                {errors.guestLName && (
                                    <span className={"error-span"}>{errors.guestLName.message}</span>)}
                            </div>
                            <div className="flex-1 w-full">
                                <label className={"block text-xl mb-1"}>Ответственные за клиента</label>
                                <Dropdown parentCallback={handleMultCallback} mode={'multiple'}/>
                                {/*{errors.depMems && (<span className={"error-span"}>{errors.depMems.message}</span>)}*/}
                            </div>
                        </div>
                    </div>
                    <div className={"side-section flex w-full gap-2 justify-between mt-2"}>
                        <button className="rounded-button w-full" onClick={(e) => reset()}>
                            Сбросить
                        </button>
                        <button type={"submit"} className="rounded-button w-full">
                            Создать
                        </button>
                    </div>
                </form>
            </div>
            <div className="modal-closing" onClick={() => props.setOpen(false)}>
            </div>
        </div>
    );
}