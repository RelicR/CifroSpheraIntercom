import React, {Dispatch, SetStateAction, useRef, useState} from "react";
import {api} from "../utils/axiosConfig";
import {PostInput} from "./ProstInput";
import {Dropdown} from "./Dropdown";
import {IDepProfile, IUserProfile} from "../../types/generalTypes";
import {useAccessTokenState} from "../providers/AuthContext";

type Props = {
    isOpen: boolean;
    setOpen: (Dispatch<SetStateAction<boolean>>);
    setCreated: (status: boolean) => void;
}

export const ModalAnnouncement = (props: Props) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const formRef = useRef<HTMLFormElement>(null);
    const titleRef = useRef<HTMLInputElement>(null);
    const descRef = useRef<HTMLTextAreaElement>(null);
    const pinnedRef = useRef<HTMLInputElement>(null);
    const targetRef = useRef<IDepProfile>(null);
    const context = useAccessTokenState();
    const {getAccess} = context;

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        console.log('Sending announcement');
        // if (titleRef.current && descRef.current && targetRef.current && pinnedRef.current) {
        //     console.log(titleRef.current.value, descRef.current.value, pinnedRef.current.value, targetRef.current);
        //     console.log(pinnedRef.current.checked);
        // }
        if (titleRef.current && descRef.current && targetRef.current && pinnedRef.current) {
            console.log(title, description, pinnedRef.current);
            const resp = await api.post('/announcement/create',
                {
                    subject: titleRef.current.value,
                    content: descRef.current.value,
                    department: targetRef.current!,
                    isPinned: pinnedRef.current.checked,
                })
                .then(
                    async function (response) {
                        console.log(response.data.message);
                        console.log('Created announcement', response.data);
                        return response.data;
                    }, function (error) {
                        console.log(error);
                        console.log(error.message);
                    }
                );
            console.log(resp);
            (event.target as HTMLFormElement).reset();
            props.setCreated(true);
            props.setOpen(false);
        }
    }

    const handleCallback = (childData: IDepProfile[] | IUserProfile[]) => {
        console.log('Got selected from child;', childData);
        targetRef.current = childData[0] as IDepProfile;
    }

    return (
        <div className={"modal-window"} hidden={!props.isOpen}>
            <div className="modal-content">
                <h2 className={"w-full text-center"}>Новое объявление</h2>
                <form className={"modal-form"} onSubmit={(e) => handleSubmit(e)}>
                    <div className="space-y-3 w-full">
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex-1 w-full">
                                <label className={"block text-xl mb-1"}>Тема</label>
                                <input
                                    ref={titleRef}
                                    id={"subject-input"}
                                    type={"text"}
                                    className="modal-input w-full"
                                    placeholder="Тема объявления"
                                />
                            </div>
                            <div className="flex-1 w-full">
                                <label className={"block text-xl mb-1"}>Объявление</label>
                                <PostInput ref={descRef}/>
                            </div>
                            {getAccess() > 3 && (
                                <div className="flex-1 w-full">
                                    <label className={"block text-xl mb-1"}>Группа пользователей</label>
                                    <Dropdown parentCallback={handleCallback} mode={'single'} listType={'department'}
                                              target={'service'}/>
                                </div>
                            )}
                            <div className="flex-1 w-full">
                                <label className={"block text-xl mb-1"}>Отправить в</label>
                                <Dropdown parentCallback={handleCallback} mode={'single'} listType={'department'}/>
                            </div>
                            <div className="flex-1 w-full">
                                <label className={"block text-xl mb-1"}>Закрепить объявление
                                    <input ref={pinnedRef} type={"checkbox"} className={"pinned-checkbox"}/>
                                </label>
                            </div>
                            <div className={"side-section flex w-full gap-2 justify-between mt-2"}>
                                <input type={"submit"} className={"decline rounded-button w-full"} value={"Отмена"}
                                       onClick={
                                           (e) => {
                                               e.preventDefault();
                                               props.setOpen(false);
                                           }
                                       }/>
                                <input type={"reset"} className={"decline w-full"} value={"Сбросить"}/>
                                <button type={"submit"} className={"decline text-base w-full"}>Опубликовать</button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div className="modal-closing" onClick={() => props.setOpen(false)}>
            </div>
        </div>
    );
}