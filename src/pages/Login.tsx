import React from "react";
import {useParams} from "react-router-dom";
import {useForm} from 'react-hook-form';
import {apiAuth} from '../utils/axiosConfig'

export const Login = () => {
    const {mode, id} = useParams();
    const sleep =
        (ms: number) =>
            new Promise(resolve => setTimeout(resolve, ms));
    const {
        register, setError, clearErrors, getValues, handleSubmit,
        formState: {errors, isValid}
    } = useForm({
        defaultValues: {
            username: '',
            password: '',
        },
        mode: 'onChange'
    });

    console.log(mode, id);

    const handleLogin = async () => {
        const {username, password} = getValues();
        const resp = await apiAuth.post(`/login`, {
            username: username,
            password: password,
            mode: mode,
            guest: id
        }).then(
            function (response) {
                return {message: response.data.message, status: true};
            }, function (error) {
                console.log(error);
                return {message: error.message, status: false};
            }
        )
        console.log(resp);
        if (resp.status) await sleep(1000).then(() => {
            window.location.href = '/announcement';
        });
    };

    const onSubmit = async (data: Object) => {
        const {username, password} = getValues();
        console.log(data);
        console.log(isValid);
        checkPassword(password);
        checkUsername(username);
        console.log(errors);
        if (checkPassword(password) && checkUsername(username)) {
            console.log(errors);
            await handleLogin();
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
        <div className={"main-container"}>
            <main className={"main-window login items-center pt-10"}>
                <h2 className={"w-full text-center"}>Гостевой доступ</h2>
                <form className={"modal-form login"} onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-3 w-full">
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex-1 w-full">
                                <label className={"block text-xl mb-1"}>Логин</label>
                                <input type="text" id="username" className="text-sm w-full"
                                       {...register("username", {required: "Введите логин"})}
                                       onChange={(e) => checkUsername(e.target.value)}/>
                                {errors.username && (<span className={"error-span"}>{errors.username.message}</span>)}
                            </div>
                            <div className="flex-1 w-full">
                                <label className={"block text-xl mb-1"}>Новый пароль</label>
                                <input type="password" id="password" className="text-sm w-full"
                                       {...register("password", {required: "Задайте новый пароль"})}
                                       onChange={(e) => checkPassword(e.target.value)}/>
                                {errors.password && (<span className={"error-span"}>{errors.password.message}</span>)}
                            </div>
                        </div>
                    </div>
                    <div className={"side-section flex w-full gap-2 justify-between mt-2"}>
                        <button type={"submit"} className="rounded-button w-full">
                            Войти
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
};
