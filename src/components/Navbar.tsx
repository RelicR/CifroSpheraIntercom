import React, {Dispatch, SetStateAction} from 'react';
import {NavLink} from 'react-router-dom';

type Props = {
    isLoggedIn: boolean;
    openReg?: (Dispatch<SetStateAction<boolean>>);
    openLog?: (Dispatch<SetStateAction<boolean>>);
    openProf?: (Dispatch<SetStateAction<boolean>>);
    accLvl: number;
};

export function Navbar(props: Props) {
    console.log(props);
    return (
        <header className={""}>
            <div className="flex items-center justify-between max-w-screen-2xl mx-auto gap-2">
                <div className="flex items-center gap-6">
                    <NavLink className={"flex items-center gap-2 text-gray-600 hover:text-primary"}
                             to="/">Главная</NavLink>
                </div>
                {props.isLoggedIn ? (
                    <div className="flex items-center gap-6">
                        <NavLink className={"flex items-center gap-2 text-gray-600 hover:text-primary"}
                                 to="/chat">Чаты</NavLink>
                        <NavLink className={"flex items-center gap-2 text-gray-600 hover:text-primary"}
                                 to="/announcement">Объявления</NavLink>
                        {props.accLvl > 1 && (
                            <NavLink className={"flex items-center gap-2 text-gray-600 hover:text-primary"}
                                     to="/department">Отделы</NavLink>
                        )}
                        {props.accLvl > 2 && (
                            <NavLink className={"flex items-center gap-2 text-gray-600 hover:text-primary"}
                                     to="/guest">Клиенты</NavLink>
                        )}
                        {/*<NavLink className={"flex items-center gap-2 text-gray-600 hover:text-primary"} to="/profile">Профиль</NavLink>*/}
                        <button onClick={(e) => props.openProf!(true)}>Профиль</button>
                    </div>
                ) : (
                    <div className="flex items-center gap-6">
                        <button onClick={(e) => props.openLog!(true)}>Вход</button>
                        <button onClick={(e) => props.openReg!(true)}>Регистрация</button>
                    </div>
                )}
            </div>
        </header>
    );
}
