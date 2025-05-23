import React, {Dispatch, SetStateAction, useEffect, useRef} from "react";
import {useForm} from 'react-hook-form';
import {Dropdown} from "./Dropdown";
import {IDepartment, IUserProfile} from "../../types/generalTypes";
import {api, setAuthForInterceptor} from "../utils/axiosConfig";
import {useAccessTokenState} from "../providers/AuthContext";

type Props = {
    isOpen: boolean;
    setOpen: (Dispatch<SetStateAction<boolean>>);
    setCreated: (status: boolean) => void;
    baseSubject?: IDepartment;
    mode?: string;
}

export const ModalDepartment = (props: Props) => {
    const myRef = useRef<IUserProfile>(null);
    const hodRef = useRef<IUserProfile>(null);
    const memsRef = useRef<IUserProfile[]>([]);
    const context = useAccessTokenState();
    const {getAccess, getMyProfile} = context;
    const {
        register, resetField, reset, setError, clearErrors, getValues, setValue, handleSubmit,
        formState: {errors, touchedFields, isValid}
    } = useForm({
        defaultValues: {
            depName: '',
            depShort: '',
        },
        mode: 'onChange',
    });

    useEffect(() => {
        setAuthForInterceptor(context);
        myRef.current = getMyProfile();
    }, [context]);

    // useEffect(() => {
    //     setValue("depHod", hodRef.current);
    // }, [hodRef.current]);
    //
    // useEffect(() => {
    //     setValue("depMems", memsRef.current);
    // }, [memsRef.current]);

    const onSubmit = async (data: Object) => {
        const {depName, depShort} = getValues();
        console.log(data);
        console.log(isValid);
        console.log(touchedFields);
        console.log(hodRef, memsRef);
        console.log(memsRef.current.map((m) => m._id));
        if (isValid) {
            const resp = await api.post('/department/create', {
                department_name: depName,
                admin: hodRef.current ?? (getMyProfile() as IUserProfile),
                short_name: depShort,
                members_list: memsRef.current
            }).then(
                async function (response) {
                    alert(response.data.message);
                    console.log('Created department', response.data);
                    props.setCreated(true);
                    return response.data;
                }, function (error) {
                    console.log(error);
                    alert(error.message);
                }
            );
        }
    }

    const handleSingleCallback = (childData: IUserProfile[]) => {
        // clearErrors("depHod");
        console.log('Child data single: ', childData);
        hodRef.current = childData[0];
        console.log(hodRef.current, !!hodRef.current);
        console.log('Errors:', errors);
        console.log(isValid);
        // if (!hodRef.current) setError("depHod", {type:"custom", message:"По умолчанию Вы будете главой отдела"});
    }

    const handleMultCallback = (childData: IUserProfile[]) => {
        console.log('Child data multiple: ', childData);
        memsRef.current = childData;
        console.log(memsRef.current);
    }

    return (
        <div className={"modal-window"} hidden={!props.isOpen}>
            <div className="modal-content">
                <h2 className={"w-full text-center"}>Новый отдел</h2>
                <form className={"modal-form"} onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-3 w-full">
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex-1 w-full">
                                <label className={"block text-xl mb-1"}>Название</label>
                                <input type="text" id="depName" className="text-sm w-full"
                                       {...register("depName", {required: "Введите название"})}/>
                                {errors.depName && (<span className={"error-span"}>{errors.depName.message}</span>)}
                            </div>
                            <div className="flex-1 w-full">
                                <label className={"block text-xl mb-1"}>Аббревиатура</label>
                                <input type="text" id="depShort" className="text-sm w-full"
                                       {...register("depShort", {required: "Введите аббревиатуру"})}/>
                                {errors.depShort && (<span className={"error-span"}>{errors.depShort.message}</span>)}
                            </div>
                            <div className="flex-1 w-full">
                                <label className={"block text-xl mb-1"}>Глава отдела</label>
                                <Dropdown parentCallback={handleSingleCallback} mode={'single'}/>
                                {/*{errors.depHod && (<span className={"error-span"}>{errors.depHod.message}</span>)}*/}
                            </div>
                            <div className="flex-1 w-full">
                                <label className={"block text-xl mb-1"}>Сотрудники</label>
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