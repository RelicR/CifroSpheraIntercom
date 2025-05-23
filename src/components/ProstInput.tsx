import React, {forwardRef, useRef, useState} from "react";

type Props = {
    sendInput?: () => void;
}

// export function PostInput(props: Props) {
export const PostInput = forwardRef<HTMLTextAreaElement, Props>((props, ref) => {
    const [input, setInput] = useState('');
    const inputAreaRef = useRef<HTMLTextAreaElement>(null);

    // useEffect(() => {
    //     if (inputAreaRef.current) {
    //         inputAreaRef.current.value = input;
    //     }
    // }, [input]);

    // useEffect(() => {
    //     props.parentCallback(inputAreaRef.current!.value);
    // }, [inputAreaRef.current!.value])

    const handleEnter = (event: React.KeyboardEvent) => {
        if ((event.code === "Enter" || event.code === "NumpadEnter") && !event.shiftKey) {
            event.preventDefault();
            console.log('sendMessage Event');
            if (props.sendInput) props.sendInput();
        }
    }

    return (
        <div className={"input-area"}>
            <textarea
                ref={ref}
                id={"message-input"}
                className="chat-input"
                aria-multiline={true}
                aria-placeholder="Ваше сообщение..."
                onKeyDown={(e) => handleEnter(e)}
            >
            </textarea>
            <div className={"flex items-end gap-2"}>
                <button>F</button>
            </div>
        </div>
    )
})