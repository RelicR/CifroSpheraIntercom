import React, {useEffect, useRef} from 'react';
import {BrowserRouter as Router, Navigate, Route, Routes} from 'react-router-dom';
import {Chat} from './pages/Chat';
import {Login} from "./pages/Login";
import {Announcement} from "./pages/Announcement";
import {Home} from "./pages/Home";
import {Department} from "./pages/Department";
import {Navbar} from "./components/Navbar";
import {ModalRegister} from "./components/ModalRegister";
import {ModalLogin} from "./components/ModalLogin";
import {ModalProfile} from "./components/ModalProfile";
import {ManageGuest} from "./components/ManageGuest";
import {useAccessTokenState} from './providers/AuthContext';
import {setAuthForInterceptor} from './utils/axiosConfig';

const App: React.FC = () => {
    const [isRefreshing, setIsRefreshing] = React.useState(true);
    const [isReg, setIsReg] = React.useState(false);
    const [isLog, setIsLog] = React.useState(false);
    const [isProf, setIsProf] = React.useState(false);
    const accessLevel = useRef(0);
    const context = useAccessTokenState();
    const {getLoggedState, getAccess, serverError} = context;
    console.log(context.accessTokenRef.current);

    useEffect(() => {
        console.log(serverError);
        //context.setServerError(false, '');
        setAuthForInterceptor(context);
        setIsRefreshing(true);
        context.refreshAccessToken().then((token) => {
            if (token != null) {
                console.log('Token refreshed');
                accessLevel.current = getAccess();
            } else {
                console.log('Still not logged in');
                accessLevel.current = 0;
            }
            setIsRefreshing(false);
            console.log(serverError);
        });
    }, [context]);

    if (isRefreshing) {
        return (
            <div className={"modal-window"}>
                <div className={"loader"}></div>
            </div>
        )
    } else {
        return (
            <>
                {getLoggedState() ? (
                    <Router>
                        <Navbar openProf={setIsProf} isLoggedIn={getLoggedState()} accLvl={accessLevel.current}/>
                        <Routes>
                            <Route path="/" element={<Home/>}/>
                            <Route path="/announcement" element={<Announcement/>}/>
                            <Route path="/chat" element={<Chat/>}/>
                            {accessLevel.current > 1 && (
                                <Route path="/department" element={<Department/>}/>
                            )}
                            {accessLevel.current > 2 && (
                                <Route path="/guest" element={<ManageGuest/>}/>
                            )}
                            <Route path="*" element={<Navigate to="/" replace/>}/>
                        </Routes>
                        <ModalProfile isOpen={isProf} setOpen={setIsProf}/>
                    </Router>
                ) : (
                    <Router>
                        <Navbar openReg={setIsReg} openLog={setIsLog} isLoggedIn={getLoggedState()}
                                accLvl={accessLevel.current}/>
                        <Routes>
                            <Route path="/" element={<Home/>}/>
                            <Route path="/login/:mode/:id" element={<Login/>}/>
                            <Route path="*" element={<Navigate to="/" replace/>}/>
                        </Routes>
                        <ModalLogin isOpen={isLog} setOpen={setIsLog}/>
                        <ModalRegister isOpen={isReg} setOpen={setIsReg}/>
                    </Router>
                )}
                {(serverError.current.isError || serverError.current.isSuccess) && (
                    <div className={`server-message ${serverError.current.isError ? 'error' : 'success'}`}>
                        {serverError.current.message.split('\n').map((text, index) => (
                            <React.Fragment key={index}>
                                {text}
                                <br/>
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </>
        )
    }
};

export default App;