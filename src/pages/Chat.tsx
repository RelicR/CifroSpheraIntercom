import React, {useEffect, useRef, useState} from 'react';
import {MessageItem} from '../components/MessageItem';
import {io, Socket} from 'socket.io-client';
import {useAccessTokenState} from "../providers/AuthContext";
import {api, setAuthForInterceptor} from '../utils/axiosConfig';
import {ChatType, IChat, IMessage} from '../../types/generalTypes';
import {PostInput} from "../components/ProstInput";
import {ModalNewChat} from "../components/ModalNewChat";
import {timeAgo} from "../utils/timeFormat";

export const Chat: React.FC = () => {
    const {Private, Group} = ChatType;
    const [socket, setSocket] = useState<Socket | null>(null);
    const [messages, setMessages] = useState<IMessage[]>([]);
    const [chats, setChats] = useState<IChat[]>([]);
    const [curChat, setCurChat] = useState<IChat | null>(null);
    const [chatType, setChatType] = useState<ChatType | null>();
    const [modalOpen, setModalOpen] = useState(false);
    const chatsRef = useRef<IChat[]>([]);
    const curChatRef = useRef<IChat | null>(null);
    const messagesRef = useRef<IMessage[]>([]);
    const context = useAccessTokenState();
    const {getAccess, getAccessToken, accessTokenRef, userId} = context;
    const messageRef = useRef<HTMLTextAreaElement>(null);

    const getChats = async (type?: string) => {
        const resp = await api.get('/chats/list').then(
            function (response) {
                return response.data;
            }, function (error) {
                console.log(error);
            }
        );
        setChats(resp);
        chatsRef.current = resp;
        console.log(resp);
        console.log(chats);
        console.log(chatsRef.current);
    }

    useEffect(() => {
        setChats(chatsRef.current);
    }, [chatsRef.current]);

    useEffect(() => {
        setCurChat(curChatRef.current);
    }, [curChatRef.current]);

    useEffect(() => {
        setMessages(messagesRef.current);
    }, [messagesRef.current]);

    useEffect(() => {
        setAuthForInterceptor(context);

        if (context.getLoggedState()) {
            getChats();
            const newSocket = io('http://localhost:5000', {
                auth: {token: accessTokenRef.current, userId: userId},
                reconnectionAttempts: 3
            });

            console.log(`Access token: ${getAccessToken()}`);
            console.log(`AccessRef token: ${accessTokenRef.current}`);
            console.log(getAccessToken());

            newSocket.on('seenMsgs', (msgsToUpdate: IMessage[]) => {
                console.log('updMsg', msgsToUpdate);
                let counter = msgsToUpdate.filter((m) => m.sender._id != userId).length;
                for (let item of msgsToUpdate) {
                    if (messagesRef.current && item.chat_id == curChatRef!.current!._id) {
                        const msgIndex = messagesRef.current.findIndex((m) => m._id == item._id);
                        if (msgIndex == -1) {
                            messagesRef.current = [...messagesRef.current, item];
                        } else {
                            messagesRef.current = messagesRef.current.with(msgIndex, item);
                        }
                    }
                }
                console.log('Current messages:', messagesRef.current);
                setMessages(messagesRef.current);
                let updChat = chatsRef.current.find((c) => c._id == curChatRef!.current!._id);
                if (!!updChat) {
                    updChat.unread! -= counter;
                    chatsRef.current = chatsRef.current.with(chatsRef.current.findIndex((c) => c._id == curChatRef!.current!._id), updChat);
                    console.log('Seen updChat:', updChat);
                    setChats(chatsRef.current);
                }
            });

            newSocket.on('message', async (message: IMessage, updChat?: IChat) => {
                console.log('Socket message:', message);
                console.log('UpdChat:', updChat);
                if (updChat && chatsRef.current) {
                    const updChatIndex = chatsRef.current.findIndex((chat) => chat._id == message.chat_id);
                    if (updChatIndex == -1) {
                        await getChats().then(() => console.log('Message from new chat updated chat list'));
                    } else {
                        await getChats().then(() => console.log('Message from new chat updated chat list'));
                    }
                    setChats(chatsRef.current!);
                }
                if (messagesRef.current && message.chat_id == curChatRef!.current!._id) {
                    const msgIndex = messagesRef.current.findIndex((m) => m._id == message._id);
                    if (msgIndex == -1) {
                        messagesRef.current = [...messagesRef.current, message];
                    } else {
                        messagesRef.current[msgIndex] = message;
                    }
                }
                setMessages(messagesRef.current);
                if (chatsRef.current.findIndex((chat) => chat._id == message.chat_id) == -1) {
                    getChats().then(() => console.log('Message from new chat updated chat list'));
                }
                console.log(message);
            });

            newSocket.on('chatMessageList', (messageList: IMessage[]) => {
                console.log('Got message list', messageList);
                messagesRef.current! = messageList;
                setMessages(messageList);
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        }

    }, [context]);

    const changeChat = (chat: IChat) => {
        console.log(chat);
        setMessages(messages.filter((msg) => msg.chat_id == chat._id));
        messagesRef.current = messagesRef.current.filter((msg) => msg.chat_id == chat._id);
        socket!.emit('joinChat', chat._id);
        curChatRef!.current! = chat;
        setCurChat(chat);
        console.log(chats);
        console.log('Changed chat to:', chat, curChat);
    }

    const sendMessage = async (message?: string, chatId?: string) => {
        console.log(curChat);
        if (socket && (curChatRef!.current!._id || chatId)) {
            if (message && chatId && message.trim()) {
                console.log('SendMessage from modal input');
                console.log(message);
                socket.emit('message', chatId, message);
            } else if (messageRef.current && messageRef.current.value.trim()) {
                console.log('SendMessage from initial input');
                console.log(messageRef.current.value);
                console.log(messageRef);
                console.log(curChat);
                socket.emit('message', curChatRef!.current!._id, messageRef.current.value);
                messageRef.current.value = '';
            }
        } else alert('Не выбран чат');
    };

    const markAsSeen = async (msgId: string): Promise<boolean> => {
        console.log(msgId, curChat);
        if (socket && curChat!._id) {
            console.log('Emitting markSeen');
            socket.emit('markSeen', msgId, curChat!._id);
            return true;
        }
        return false;
    }

    return (
        <div className={"main-container"}>
            <aside className={""}>
                <h2 className={"aside-header"}>Чаты</h2>
                <div className={"p-4 flex-1 overflow-hidden"}>
                    <h3 className={"section-header"}>Категория</h3>
                    <div className="side-section flex flex-col gap-2 items-center">
                        <button
                            className={`rounded-button w-full ${chatType == null ? 'selected' : ''}`}
                            onClick={(e) => setChatType(null)}>
                            Все
                        </button>
                        <button
                            className={`rounded-button w-full ${chatType == Private ? 'selected' : ''}`}
                            onClick={(e) => setChatType(Private)}>
                            Личные чаты
                        </button>
                        <button
                            className={`rounded-button w-full ${chatType == Group ? 'selected' : ''}`}
                            onClick={(e) => setChatType(Group)}>
                            Групповые чаты
                        </button>
                    </div>
                    <div className={"section-header flex justify-between"}>
                        <h3 className={""}>Список чатов</h3>
                        {
                            getAccess() > 1 && (
                                <span
                                    className={"add-span"}
                                    onClick={(e) => setModalOpen(true)}
                                >+</span>
                            )
                        }
                    </div>
                    <div className="side-section">
                        {chats?.filter((chat) => chatType == null ? chat : chat.chat_type == chatType).map((chat, index) => (
                            <div
                                className={"chat-item-card"}
                                key={index}
                                onClick={async (e) => {
                                    await changeChat(chat);
                                    console.log('Tried to change chat');
                                }}>
                                <h4 className={"side-section-item-header"}>
                                    {chat.chat_name}
                                </h4>
                                {chat.unread! > 0 && (
                                    <span className="count-span">{chat.unread! < 99 && chat.unread || '99'}</span>
                                )}
                                {chat.last_message && (
                                    <>
                                        <p className={"side-section-item sender"}>
                                            {chat.last_message?.sender?.display_name + ":"}
                                        </p>
                                        <p className={"side-section-item content"}>
                                            {chat.last_message?.content}
                                        </p>
                                        <div className={"chat-item-time"}>
                                            {timeAgo(chat.last_message.createdAt!)}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </aside>
            <main className={"main-window"}>
                <div className={"flex items-center p-4 border-b border-gray-200"}>
                    <h2 className={"chat-header"}>{curChat ? curChat.chat_name : "Чат не выбран"}</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length > 0 && (
                        <>
                            {messages.map((msg) => (
                                <MessageItem
                                    key={msg._id}
                                    message={msg}
                                    type={msg.sender._id == userId}
                                    userId={userId!}
                                    markSeen={markAsSeen}
                                />
                            ))}
                        </>
                    )}
                </div>
                <div className={"p-4 border-t border-gray-200"}
                     hidden={!curChat}>
                    <PostInput sendInput={sendMessage} ref={messageRef}/>
                </div>
            </main>
            {modalOpen
                &&
                <ModalNewChat
                    sendInput={sendMessage}
                    isOpen={modalOpen}
                    setOpen={setModalOpen}
                    changeChat={(chat: IChat) => changeChat(chat)}/>}
        </div>
    );
}