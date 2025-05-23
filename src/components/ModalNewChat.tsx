import React, {Dispatch, SetStateAction, useRef, useState} from "react";
import {api} from "../utils/axiosConfig";
import {ChatType, IChat, IUserProfile} from "../../types/generalTypes";
import {Dropdown} from "./Dropdown";
import {PostInput} from "./ProstInput";

type Props = {
    isOpen: boolean;
    setOpen: (Dispatch<SetStateAction<boolean>>);
    changeChat: (chat: IChat) => void;
    sendInput: (message?: string, chatId?: string) => void;
}

export const ModalNewChat = (props: Props) => {
    const {Private, Group} = ChatType;
    const [selected, setSelected] = useState<IUserProfile[]>([]);
    const [chatType, setChatType] = useState<ChatType>(Private);
    const messageRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (selected.length == 0) {
            alert('Выберите участников чата');
            return false;
        }
        const data = await createChat();
        if (data) {
            console.log(data);
            props.changeChat(data.chat);
            if (messageRef.current) {
                props.sendInput(messageRef.current.value, data.chat._id);
            }
            props.setOpen(false);
        } else alert('Ошибка создания чата');
    }

    async function createChat() {
        console.log('Creating chat');
        const resp = await api.post('chats/create',
            {members_list: selected.map((user) => user._id), chat_type: chatType})
            .then(
                async function (response) {
                    console.log(response.data.message);
                    console.log('Created chat', response.data.chat_id);
                    return response.data;
                }, function (error) {
                    console.log(error);
                    console.log(error.message);
                }
            );
        return resp ?? null;
    }

    const handleCallback = (childData: IUserProfile[]) => {
        console.log('Child data: ', childData);
        setSelected(childData);
        setChatType(childData.length > 1 ? Group : Private);
    }

    return (
        <div className={"modal-window"} hidden={!props.isOpen}>
            <div className="modal-content">
                <h2 className={"w-full text-center"}>Новый чат</h2>
                <h3>Тип:</h3>
                <div className="side-section flex flex-row gap-2 items-center">
                    <button
                        className={`rounded-button w-full ${chatType == Private ? 'selected' : ''}`}
                        disabled={true}
                    >
                        Личный
                    </button>
                    <button
                        className={`rounded-button w-full ${chatType == Group ? 'selected' : ''}`}
                        disabled={true}
                    >
                        Групповой
                    </button>
                </div>
                <form className={"modal-form"} onSubmit={handleSubmit}>
                    <h3>Участники:</h3>
                    <Dropdown
                        parentCallback={handleCallback} mode={'multiple'}/>
                    <h3>Сообщение:</h3>
                    <PostInput ref={messageRef}/>
                    <div className={"flex w-full justify-between mt-2"}>
                        <input type={"submit"} className={"decline"} value={"Отмена"} onClick={
                            (e) => {
                                e.preventDefault();
                                props.setOpen(false);
                            }
                        }/>
                        <input type={"submit"} value={"Создать"}/>
                    </div>
                </form>
            </div>
            <div className="modal-closing" onClick={() => props.setOpen(false)}>
            </div>
        </div>
    );
}