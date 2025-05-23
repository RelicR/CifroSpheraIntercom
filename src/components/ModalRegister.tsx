import React, {Dispatch, SetStateAction} from "react";
import {useForm} from 'react-hook-form';
import {apiAuth} from '../utils/axiosConfig'

type Props = {
    isOpen: boolean;
    setOpen: (Dispatch<SetStateAction<boolean>>);
}
export const ModalRegister = (props: Props) => {
    const sleep =
        (ms: number) =>
            new Promise(resolve => setTimeout(resolve, ms));
    const {
        register, resetField, reset, setError, clearErrors, getValues, setValue, handleSubmit,
        formState: {errors, isValid}
    } = useForm({
        defaultValues: {
            firstName: '',
            lastName: '',
            username: '',
            password: ''
        },
        mode: 'onChange'
    });

    const handleRegister = async () => {
        const {firstName, lastName, username, password} = getValues();
        const resp = await apiAuth.post('/register', {
            firstName: firstName,
            lastName: lastName,
            username: username,
            password: password,
        }).then(
            function (response) {
                return {message: response.data.message, status: true};
            }, function (error) {
                console.log(error);
                return {message: error.message, status: false};
            }
        )
        console.log(resp);
        if (resp.status) await sleep(2000).then(() => {
            window.location.href = '/announcement';
        });
    };

    const regBased = async () => {
        await apiAuth.post('/register', {
            firstName: 'Боби',
            lastName: 'Лесной',
            username: 'test1',
            password: 'testtest1',
        }).then(
            function (response) {
                return response.data;
            }, function (error) {
                console.log(error);
            }
        )
        await apiAuth.post('/register', {
            firstName: 'Мага',
            lastName: 'Мидовый',
            username: 'test2',
            password: 'testtest2',
        }).then(
            function (response) {
                return response.data;
            }, function (error) {
                console.log(error);
            }
        )
        await apiAuth.post('/register', {
            firstName: 'Лох',
            lastName: 'Цветочный',
            username: 'test3',
            password: 'testtest3',
        }).then(
            function (response) {
                return response.data;
            }, function (error) {
                console.log(error);
            }
        )
    }

    const onSubmit = async (data: Object) => {
        const {password, username} = getValues();
        console.log(data);
        console.log(isValid);
        checkPassword(password);
        checkUsername(username);
        console.log(errors);
        if (checkPassword(password) && checkUsername(username)) {
            console.log(errors);
            await handleRegister();
        }
    }

    const checkPassword = (password: string) => {
        clearErrors("password");
        if (password.length < 8) {
            setError("password", {
                message: "Минимальная длина пароля - 8 символов"
            });
            return false;
        }
        if (password.length > 20) {
            setError("password", {
                message: "Максимальная длина пароля - 20 символов"
            });
            return false;
        }
        if (!/^(?=.*\d)(?=.*[a-zA-Z])(?!.*\s).{8,20}$/gm.test(password)) {
            setError("password", {
                message: "Пароль не должен содержать пробел и должен содержать минимум 1 цифру"
            });
            return false;
        }
        return true;
    }
    const checkUsername = (username: string) => {
        clearErrors("username");
        if (username.length < 4) {
            setError("username", {
                message: "Минимальная длина логина - 4 символа"
            });
            return false;
        }
        if (username.length > 15) {
            setError("username", {
                message: "Максимальная длина логина - 15 символов"
            });
        }
        return true;
    }

    return (
        <div className={"modal-window"} hidden={!props.isOpen}>
            <div className="modal-content">
                <h2 className={"w-full text-center"}>Регистрация</h2>
                <form className={"modal-form"} onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-3 w-full">
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex-1 w-full">
                                <label className={"block text-xl mb-1"}>Имя</label>
                                <input type="text" id="firstName" className="text-sm w-full"
                                       {...register("firstName", {required: "Введите имя"})}/>
                                {errors.firstName && (<span className={"error-span"}>{errors.firstName.message}</span>)}
                            </div>
                            <div className="flex-1 w-full">
                                <label className={"block text-xl mb-1"}>Фамилия</label>
                                <input type="text" id="lastName" className="text-sm w-full"
                                       {...register("lastName", {required: "Введите фамилию"})}/>
                                {errors.lastName && (<span className={"error-span"}>{errors.lastName.message}</span>)}
                            </div>
                            <div className="flex-1 w-full">
                                <label className={"block text-xl mb-1"}>Логин</label>
                                <input type="text" id="username" className="text-sm w-full"
                                       {...register("username", {required: "Введите логин"})}
                                       onChange={(e) => checkUsername(e.target.value)}/>
                                {errors.username && (<span className={"error-span"}>{errors.username.message}</span>)}
                            </div>
                            <div className="flex-1 w-full">
                                <label className={"block text-xl mb-1"}>Пароль</label>
                                <input type="password" id="password" className="text-sm w-full"
                                       {...register("password", {required: "Введите Пароль",})}
                                       onChange={(e) => checkPassword(e.target.value)}/>
                                {errors.password && (<span className={"error-span"}>{errors.password.message}</span>)}
                            </div>
                        </div>
                    </div>
                    <div className={"side-section flex w-full gap-2 justify-between mt-2"}>
                        <button className="rounded-button w-full" onClick={(e) => reset()}>
                            Сбросить
                        </button>
                        <button type={"submit"} className="rounded-button w-full">
                            Регистрация
                        </button>
                    </div>
                    {/*<button onClick={handleRegister}>Register</button>*/}
                    {/*<button onClick={regBased}>RegBased</button>*/}
                </form>
            </div>
            <div className="modal-closing" onClick={() => props.setOpen(false)}>
            </div>
        </div>
    );
};
