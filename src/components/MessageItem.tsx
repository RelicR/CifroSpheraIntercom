import React, {useEffect, useState} from 'react';
import {IMessage} from '../../types/generalTypes'
import {useInView} from "react-intersection-observer";
import {timeAgo} from "../utils/timeFormat";

type Props = {
    message: IMessage;
    key: string;
    type: boolean; // true - sent, false - received
    userId: string;
    markSeen: (msgId: string) => Promise<boolean>;
}

export const MessageItem = (props: Props) => {
    const message = !props.message.seen_by!.includes(props.userId)
        ? {...props.message, _seen: false}
        : props.message.seen_by!.length > 1
            ? {...props.message, _seen: true, _delivered: true}
            : {...props.message, _seen: true, _delivered: false};
    const [isSeen, setIsSeen] = useState(true);
    const sleep =
        (ms: number) =>
            new Promise(resolve => setTimeout(resolve, ms));
    console.log('MessageItem');
    console.log(message);
    console.log(props);
    console.log('isSeen:', isSeen);

    useEffect(() => {
        setIsSeen(message._seen);
    }, [message._seen]);

    const {ref, inView, entry} = useInView({
        /* Optional options */
        threshold: 0.7,
        triggerOnce: true,
        onChange: async (inView, entry) => {
            console.log('Marking as seen');
            if (inView) {
                message._seen = await props.markSeen(message._id);
            }
            await sleep(500).then(() => setIsSeen(message._seen));
        },
    });


    return (
        <div
            className={`message-item ${props.type
                ? "justify-end *:sent"
                : "justify-start *:received"}`}
            ref={!message._seen ? ref : null}
            onLoad={(e) => {
                console.log(e);
                if (entry && ref != null) {
                    console.log('Gotta scroll to', entry.target.clientTop - window.pageYOffset + window.innerHeight);
                }
            }}>
            <div className={`message-bubble ${!isSeen ? "highlighted" : ""}`}>
                {message.sender._id != props.userId && (
                    <div className={"message-sender"}>
                        {message.sender.display_name}
                    </div>
                )}
                <div className={"message-content"}>
                    {message.content!.split("\n").map((text, index) => (
                        <React.Fragment key={index}>
                            {text}
                            <br/>
                        </React.Fragment>
                    ))}
                </div>
                <div className="item-time">
                    {timeAgo(message.createdAt!)}
                </div>
                {props.type && (message._delivered
                    ? (<span className={"seen-span seen"}>✓</span>)
                    : (<span className={"seen-span"}>✓</span>))
                }
            </div>
        </div>
    )
}