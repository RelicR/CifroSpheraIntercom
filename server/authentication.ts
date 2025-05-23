import express, {Request, Response} from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import bodyParser from 'body-parser';
import {Department, Guest, Token, User} from './models/dbschemas'
import {UserRoles} from "../types/generalTypes";

require('dotenv').config();

const {DB_URI, AUTH_PORT, JWT_SECRET, CAT_SUP, CAT_SUU, REFRESH_SECRET, HOST_URL} = process.env;
const TOKEN_EXPIRES = Number(process.env.TOKEN_EXPIRES);

const app = express();

app.use(cors({
    credentials: true,
    origin: `${HOST_URL}:8080`,
    methods: 'POST',
}));
app.use(bodyParser.json());
app.use(cookieParser());

mongoose
    .connect(DB_URI!)
    .then(() => console.log('Auth server connected to MongoDB'))
    .catch((err) => console.error('MongoDB auth connection error:', err));

const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';

function transliterate(text: string): string {
    const map: { [key: string]: string } = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
        'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i',
        'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
        'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
        'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch',
        'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '',
        'э': 'e', 'ю': 'yu', 'я': 'ya', ' ': '',

        // заглавные буквы
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D',
        'Е': 'E', 'Ё': 'E', 'Ж': 'Zh', 'З': 'Z', 'И': 'I',
        'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N',
        'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T',
        'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch',
        'Ш': 'Sh', 'Щ': 'Shch', 'Ъ': '', 'Ы': 'Y', 'Ь': '',
        'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
    };

    let result = text.split('').map(char => map[char] || char).join('');
    result = result.replace(/[^a-zA-Z0-9]/g, '');

    return result;
}

const genGuestCreds = (fname: string, lname: string) => {
    let password = '';
    const username =
        (transliterate(fname).slice(0, 6) + transliterate(lname).slice(0, 6))
            .concat((Math.floor(Math.random() * (999 - 1) + 1)).toString());
    const length = Math.floor(Math.random() * (19 - 9) + 9);
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    return {username: username, password: password};
}

const genRefreshToken = (userId: string) => {
    //const accessToken = jwt.sign({ userId }, JWT_SECRET!, { expiresIn: '30m' });
    const refreshToken = jwt.sign({userId}, REFRESH_SECRET!, {expiresIn: '7d'});
    return {refreshToken: refreshToken, tokenExpiringAt: new Date(Date.now() + TOKEN_EXPIRES)};
}

const genAccessToken = (userId: string, role: UserRoles) => {
    return jwt.sign({userId, role}, JWT_SECRET!, {expiresIn: '30m'});
}

const regServiceUser = async () => {
    const service_pass = await bcrypt.hash(CAT_SUP!, 10);
    await User.findOneAndUpdate({username: CAT_SUU!}, {
        username: CAT_SUU!,
        display_name: "Суперпользователь",
        password: service_pass,
        role: UserRoles.Service,
    }, {upsert: true}).catch((err) => {
        console.error('Error during service setup:', err);
    }).finally(() => console.log('Superuser registered'));
    const serviceUser = await User.findOne({username: CAT_SUU!});
    const {refreshToken, tokenExpiringAt} = genRefreshToken(serviceUser!._id.toString());
    await Token.findOneAndUpdate({user_id: serviceUser!._id.toString()}, {
        refresh_token: refreshToken,
        expires: tokenExpiringAt
    }, {upsert: true}).then();
}

const regServiceDeps = async () => {
    const adminUser = await User.findOne({username: CAT_SUU!});
    const serviceMembers = await User.find({role: {$in: [UserRoles.Service, UserRoles.Director, UserRoles.SystemAdmin]}})
    for (let role of Object.entries(UserRoles)) {
        const serviceDep = await Department.findOneAndUpdate({short_name: role[0]}, {
            department_name: role[1],
            short_name: role[0],
            admin: adminUser!,
            linked_chat_id: '',
            members_list: serviceMembers,
        }, {upsert: true}).catch((err) => {
            console.error('Error during service setup:', err);
        }).finally(() => console.log('Service department registered', role[0]));
    }
}

async function setUpServer() {
    await regServiceUser();
    await regServiceDeps();
    // Register Endpoint
    app.post('/api/register', async (req: Request, res: Response) => {
        let {firstName, lastName, username, password} = req.body;
        const mode = req.query.mode;
        console.log(firstName, lastName, username, password);

        try {
            let hashedPassword: string = "";
            if (mode == 'guest') {
                username = genGuestCreds(firstName, lastName).username;
                let existingGuest = await User.findOne({username});
                while (existingGuest) {
                    username = genGuestCreds(firstName, lastName).username;
                    existingGuest = await User.findOne({username});
                }
                password = genGuestCreds(firstName, lastName).password;
                hashedPassword = await bcrypt.hash(password, 10);
            } else {
                const existingUser = await User.findOne({username});
                if (existingUser) {
                    return res.status(400).json({message: 'Пользователь уже существует'});
                }

                // Hash the password
                hashedPassword = await bcrypt.hash(password, 10);
            }


            // Create a new user
            const newUser = new User({
                username: username,
                password: hashedPassword,
                display_name: firstName + ' ' + lastName,
                role: mode == 'guest' ? UserRoles.Guest : UserRoles.Staff,
            });
            await newUser.save();
            console.log(newUser._id.toString());

            if (mode == 'guest') {
                const {refreshToken, tokenExpiringAt} = genRefreshToken(newUser._id.toString());
                // const accessToken = genAccessToken(newUser._id.toString());
                console.log(`${refreshToken}\n${tokenExpiringAt}`);
                //res.status(201).json({message: 'User registered successfully.'});
                await new Token({
                    user_id: newUser._id.toString(),
                    refresh_token: refreshToken,
                    expires: tokenExpiringAt
                }).save().then();
                await new Guest({
                    user: newUser,
                    login_href: `${HOST_URL}:8080/login/guest/${newUser._id}`
                }).save();
                return res.status(200).json({
                    message: 'Успешное создание гостевого доступа',
                    guestId: newUser._id.toString()
                });
            } else {
                const {refreshToken, tokenExpiringAt} = genRefreshToken(newUser._id.toString());
                // const accessToken = genAccessToken(newUser._id.toString());
                console.log(`${refreshToken}\n${tokenExpiringAt}`);
                //res.status(201).json({message: 'User registered successfully.'});
                await new Token({
                    user_id: newUser._id.toString(),
                    refresh_token: refreshToken,
                    expires: tokenExpiringAt
                }).save().then();
                return res.status(200).json({message: 'Успешная регистрация'});
            }
        } catch (err) {
            console.error(`Registration error (${username}):`, err);
            return res.status(500).json({message: 'Internal server error'});
        }
    });
//
// Login Endpoint
    app.post('/api/login', async (req: Request, res: Response) => {
        let {username, password, mode, guest} = req.body;

        try {
            // Check the user
            console.log('Login attempt with params:', username, password, mode, guest);
            if (mode == 'guest' && !!guest) {
                const guest_password = await bcrypt.hash(password, 10);
                const guest_user = await User.findOneAndUpdate({_id: guest}, {password: guest_password}).catch((err) => {
                    return res.status(400).json({message: err.message});
                });
                console.log(guest_user);
                await Guest.findOneAndUpdate({"user._id": guest}, {user: guest_user}).catch((err) => {
                    return res.status(400).json({message: err.message});
                });
                // return res.status(400).json({ message: 'Got to the end of guest login' });
            }
            const user = await User.findOne({username});
            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(400).json({message: 'Неверные данные пользователя'});
            }

            const {refreshToken, tokenExpiringAt} = genRefreshToken(user._id.toString());
            const accessToken = genAccessToken(user._id.toString(), user.role!);
            console.log(accessToken);

            res.cookie('cat_rft', refreshToken, {
                httpOnly: true,
                maxAge: TOKEN_EXPIRES,
                expires: tokenExpiringAt
            });
            res.cookie('cat_uid', user._id.toString(), {
                maxAge: TOKEN_EXPIRES,
                expires: tokenExpiringAt
            });
            return res.status(200).json({
                message: 'Успешный вход',
                cat_acst: accessToken,
                cat_uid: user._id.toString()
            });
        } catch (err) {
            console.error(`Login error (${username}):`, err);
            return res.status(500).json({message: 'Internal server error'});
        }
    });

    app.post('/api/logout', async (req: Request, res: Response) => {
        const refreshToken = req.cookies.cat_rft;
        const user_id = req.cookies.cat_uid;
        try {
            if (refreshToken && user_id) {
                const decoded = jwt.verify(refreshToken, REFRESH_SECRET!) as { userId: string, exp: number };
                if (decoded.userId == user_id && new Date(decoded.exp * 1000) > new Date()) {
                    await Token.updateOne({refresh_token: refreshToken}, {refresh_token: user_id});
                }
            }
        } catch (err) {
            console.error(`Logout error (${user_id}):`, err);
            // return res.status(500).json({ message: 'Internal server error' });
        }
        return res.clearCookie('cat_uid').clearCookie('cat_rft')
            .status(401).json({message: 'Successfully logged out'});
    });

    app.get('/api/refresh', async (req: Request, res: Response) => {
        console.log(req.cookies);
        console.log('Refresh emitted')

        const refreshToken = req.cookies.cat_rft;
        //const user_id = req.query.id;
        const user_id = req.cookies.cat_uid;
        // if (!refreshToken || !user_id) return res.status(401).json({message: 'Invalid credentials'});
        if (!refreshToken || !user_id) {
            return res.clearCookie('cat_uid').clearCookie('cat_rft')
                .status(401).json({message: 'Invalid credentials'});
        }

        // Проверяем refreshToken в БД
        const token = await Token.findOne({user_id: user_id});
        const user = await User.findOne({_id: user_id})
        if (!token || !user) {
            return res.clearCookie('cat_uid').clearCookie('cat_rft')
                .status(401).json({message: 'Invalid credentials'});
        }
        //const user_id = token.user_id;

        try {
            const decoded = jwt.verify(refreshToken, REFRESH_SECRET!) as { userId: string, exp: number };
            if (decoded.userId !== user_id || new Date(decoded.exp * 1000) < new Date()) {
                return res.clearCookie('cat_uid').clearCookie('cat_rft')
                    .status(401).json({message: 'Invalid token information'});
            }
            const accessToken = genAccessToken(user_id, user.role!);
            const {refreshToken: newRefreshToken, tokenExpiringAt} = genRefreshToken(user_id);

            // Обновляем refreshToken в БД и куке
            token.refresh_token = newRefreshToken;
            await token.save();

            console.log(accessToken);
            console.log(newRefreshToken);

            res.cookie('cat_rft', newRefreshToken, {
                httpOnly: true,
                maxAge: TOKEN_EXPIRES,
                expires: tokenExpiringAt
            }); // secure true при продакшене

            return res.status(200).json({message: 'Refresh successful', cat_acst: accessToken, cat_uid: user_id});
        } catch (err) {
            console.log(err);
            return res.status(500).json('Internal server error');
        }
    });
}

setUpServer().then(() => console.log('Done setUpServer'));

// Graceful shutdown function
const shutdown = async () => {
    console.log('Shutting down auth server...');
    server.close((err) => {
        console.log('Http server closed.');
        process.exit(err ? 1 : 0);
    });

    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');

    // Exit the process
    process.exit(0);
};

// Handle shutdown signals
process.on('SIGINT', shutdown); // Ctrl+C
process.on('SIGTERM', shutdown); // Termination signal

// Start the server
const server = app.listen(AUTH_PORT, () => {
    console.log(`Authentication server running on ${HOST_URL}:${AUTH_PORT}`);
});