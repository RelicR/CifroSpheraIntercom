import express, {NextFunction, Request, Response} from 'express';
import http from 'http';
import {ExtendedError, Server, Socket} from 'socket.io';
import cors from 'cors';
import jwt, {JwtPayload} from 'jsonwebtoken';
import mongoose from 'mongoose';
import * as db from './models/dbschemas';
import {escape} from "node:querystring";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import * as I from '../types/generalTypes';

require('dotenv').config();

const {DB_URI, SERVER_PORT, JWT_SECRET, HOST_URL} = process.env;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        credentials: true,
        origin: `${HOST_URL}:8080`, // Allow all origins ('*' is for development only)
    },
});

app.use(cors({
    credentials: true,
    origin: `${HOST_URL}:8080`,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json());
app.use(verifyToken);
app.use(express.static(__dirname + '\\public'));

mongoose
    .connect(DB_URI!)
    .then(() => console.log('General server connected to MongoDB'))
    .catch((err) => console.error('MongoDB server connection error:', err));

function jwtVerify(token: string) {
    let userId: string = 'none';
    jwt.verify(token, JWT_SECRET!, (err, decoded) => {
        if (err || !decoded) {
            throw err;
        }
        console.log('Decoded jwt verification', decoded);
        userId = (decoded as JwtPayload).userId;
    });
    const decoded = jwt.verify(token, JWT_SECRET!) as { userId: string, role: I.UserRoles };
    return {userId: decoded.userId, role: decoded.role};
}

function verifyToken(req: Request, res: Response, next: NextFunction): Response | undefined {
    if (!req.headers.authorization) {
        return res.status(401).json({message: 'Unauthorized no header'});
    }
    const token = req.headers.authorization.split(' ')[1];
    const userId = req.cookies.cat_uid;
    if (!token || !userId) {
        return res.status(401).json({message: 'Unauthorized no auth'});
    }
    try {
        const decoded = jwtVerify(token);
        res.locals.userId = decoded.userId;
        res.locals.role = decoded.role;
        console.log(decoded);
    } catch (err) {
        console.log('Error on token verify: ', err);
        return res.status(401).json({message: 'Invalid token'});
    }
    console.log('VerifyToken: ');
    console.log(token);
    console.log('VerifyToken for resId:', req.url);
    next();
}

function verifySocketToken(socket: Socket, next: (err?: ExtendedError) => void) {
    if (!socket.handshake.auth) {
        console.log('Disconnecting user cause of handshake.', socket.id);
        return socket.disconnect();
    }
    const token = socket.handshake.auth.token;
    const userId = socket.handshake.auth.userId;
    if (!token || !userId) {
        return socket.disconnect();
    }
    try {
        jwtVerify(token);
    } catch (err) {
        console.log('Error on token verify: ', err);
        socket.emit('error', 'Invalid token');
        socket.disconnect();
    }
    console.log('VerifySocketToken: ');
    console.log(token);
    next();
}

// async function getChatRooms(): Promise<{ [k: string]: string[] }> {
//     const chats_list = await db.Chat.find({}, {_id: 1, members_list: 1});
//     return chats_list
//         ? Object.fromEntries(
//             chats_list.map((chat): [string, string[]] => [chat._id.toString(), chat.members_list!])
//         )
//         : {}
// }

async function getChatRooms(): Promise<[string, string[]][]> {
    const chats_list = await db.Chat.find({}, {_id: 1, members_list: 1});
    return chats_list
        ? chats_list.map((chat): [string, string[]] => [chat._id.toString(), chat.members_list!])
        : []
}

async function setUpServer() {
    app.get('/api/users', async (req: Request, res: Response) => {
        const department_id = req.query.depId as string | undefined;
        console.log(`Get users list by ${res.locals.userId}`);
        console.log(req.query);
        const mode = req.query.mode;
        if (!!mode && mode == 'myInfo') {
            const user = await db.User.findOne({_id: res.locals.userId});
            console.log('Single user list');
            return res.status(200).json(user);
        }
        if (!!mode && mode == 'service') {
            const user_list = await db.User.find({
                username: {$in: [I.UserRoles.Guest, I.UserRoles.Staff, I.UserRoles.HeadOfDepartment]}
            });
            console.log('Service user list');
            return res.status(200).json(user_list);
        }
        if (!!mode && mode == 'guests') {
            const guest_list = await db.Guest.find();
            console.log('Guest user list');
            return res.status(200).json(guest_list);
        }
        if (department_id != '' && department_id != undefined) {
            console.log('DepId:', department_id);
            console.log(typeof department_id);
            console.log(req.query);
            const user_list = await db.getDepMembers(res.locals.userId, department_id);
            console.log(user_list);
            return res.status(200).json(user_list);
        } else {
            const user_list = await db.getUsersList(res.locals.userId);
            console.log(user_list);
            return res.status(200).json(user_list);
        }
    });

    app.post('/api/users/update', async (req: Request, res: Response) => {

    });

    app.get('/api/chats/list', async (req: Request, res: Response) => {
        const chat_list = await db.getChatList(res.locals.userId);
        console.log('Chat list:', chat_list);
        res.status(200).json(chat_list);
    });

    app.post('/api/chats/create', async (req: Request, res: Response) => {
        console.log('Chat create invoked');
        console.log(req.body);
        const {members_list, chat_type, chat_name, guestId} = req.body;
        const mode = req.query.mode;
        console.log(members_list);
        console.log(chat_type);
        console.log(mode);
        const chat_members_list = members_list.concat([res.locals.userId]).sort();
        if (!members_list || !chat_type) {
            return res.status(400).json({message: 'Неверные данные чата'});
        }
        console.log(`Create chat with ${members_list} by ${res.locals.userId}`);
        const existingChat = await db.Chat.findOne({
            members_list: chat_members_list
        });
        if (existingChat) {
            console.log('Чат уже существует');
            return res.status(200).json({chat_status: 'exists', chat: existingChat, message:"Чат уже существует"});
        } else {
            if (mode == 'guest') {
                const manager_list = await db.User.find({_id: {$in: members_list.filter((m: string) => m != guestId)}});
                console.log('Manager list:', manager_list);
                console.log('Member list:', members_list);
                await db.Guest.findOneAndUpdate({"user._id": guestId}, {manager: manager_list});
            }
            console.log('Creating new chat');
            await new db.Chat({
                chat_name: chat_type == I.ChatType.Group ? chat_name || 'Групповой чат' : null,
                chat_type: chat_type,
                members_list: chat_members_list,
                admin: chat_type == I.ChatType.Group || chat_type == I.ChatType.Department ? await db.getUserProfile(res.locals.userId) : {},
            }).save().then((chat) => {
                console.log('New chat created');
                res.status(200).json({message: 'Чат создан', chat_status: 'created', chat: chat});
            });
        }
    });

    app.post('/api/chats/update', async (req: Request, res: Response) => {
        console.log(req.body);
        const {message_id} = req.body;
        const action = req.query.action;
        console.log('Chat update invoked with params: ', message_id, action);
        if (action == 'seen' && !message_id) {
            return res.status(400).json({message: 'Invalid info', success: false});
        }
        switch (action) {
            case 'seen':
                const seenMsg = await db.Message.findOne({_id: message_id});
                await db.Message.updateMany({
                        $or: [
                            {_id: message_id},
                            {$and: [{chat_id: seenMsg!.chat_id}, {createdAt: {$lte: seenMsg!.createdAt}}]}
                        ]
                    },
                    {seen_by: {$push: res.locals.userId}}
                );
                break;
            default:
                break;
        }
        res.status(200).json({message: 'Marked as seen', success: true});
    });

    //TODO: добавить departments и проверку на роли для публикации всем
    app.post('/api/announcement/create', async (req: Request, res: Response) => {
        console.log('Create announcement');
        const {subject, content, department, isPinned} = req.body;
        if (!subject || !content || !department) {
            res.status(400).json({message: 'Неверные данные объявления'});
        }
        console.log('New announcement from ', res.locals.userId, ' with content:\n', subject, content, isPinned);
        await new db.Announcement({
            sender: await db.getUserProfile(res.locals.userId),
            department: department,
            subject: subject,
            content: content,
            _pinned: isPinned,
        }).save().then((announcement) => {
            console.log('New announcement created', announcement);
            res.status(200).json({message: 'Объявление создано'});
        });
    });

    app.get('/api/announcement/list', async (req: Request, res: Response) => {
        console.log('Get announcement list');
        await db.getAnnList(res.locals.userId, res.locals.role);
        // const announcement_list = await db.Announcement.find({department_id: 1})
        // const announcement_list = await db.Announcement.find({})
        //     .sort({createdAt: "desc"});
        const announcement_list = await db.getAnnList(res.locals.userId, res.locals.role);
        res.status(200).json(announcement_list ?? []);
    });

// TODO: проверка роли (только генеральный или сисадмин)
    app.post('/api/department/create', async (req: Request, res: Response) => {
        console.log('Create department');
        let department: I.IDepartment = req.body;
        console.log('New department by ', res.locals.userId, ' with params:\n', department);
        const admin = !department.admin
            ? await db.getUserProfile(res.locals.userId)
            : await db.getUserProfile(department.admin._id);
        if (!admin) return res.status(400).json({message: 'Неверные данные отдела'});
        department.admin = admin;
        department.members_list = department.members_list.includes(admin) ? department.members_list : department.members_list.concat([admin]);
        console.log('New department by ', res.locals.userId, ' with params:\n', department);
        await new db.Chat({
            chat_name: `${department.department_name}`,
            chat_type: I.ChatType.Group,
            admin: department.admin,
            members_list: department.members_list.map((m) => m._id),
        }).save().then(async (chat) => {
            console.log('Department chat created');
            department.linked_chat_id = chat._id.toString();
            await new db.Department(department).save().then(async (dep) => {
                await db.User.updateMany({_id: {$in: department.members_list.map((m) => m._id)}}, {$push: {department: dep._id}});
                await db.User.updateOne({
                    _id: dep.admin._id,
                    role: {$nin: [I.UserRoles.SystemAdmin, I.UserRoles.Director]},
                }, {role: I.UserRoles.HeadOfDepartment});
            });
            chat.last_message = await new db.Message({
                chat_id: department.linked_chat_id,
                sender: department.admin,
                content: "Чат отдела создан"
            }).save();
            await chat.save();
            console.log('Department created');
            res.status(200).json({message: 'Отдел создан'});
        });
    });

    app.get('/api/department/list', async (req: Request, res: Response) => {
        console.log('Get department list');
        const department_id = req.query.depId;
        const mode = req.query.mode;
        const target = req.query.target;
        console.log('With params: ', department_id, mode);
        if (department_id != '' && department_id) {
            const department_list = await db.Department.findOne({
                department_id: department_id,
            });
            console.log(department_list);
            res.status(200).json(department_list);
        } else {
            let department_list = {};
            if (target == 'service') {
                department_list = await db.getServDep(res.locals.userId, res.locals.role);
            } else if (mode == 'manage') {
                department_list = await db.getHodDepList(res.locals.userId, res.locals.role);
            } else {
                department_list = await db.getDepList(res.locals.userId, res.locals.role);
            }
            // console.log('123');
            // await db.getHodDepList(res.locals.userId).then((deps)=>console.log('321', deps));
            // console.log(department_list);
            res.status(200).json(department_list);
        }
    });
// TODO: проверка на роли
    app.post('/api/department/update', async (req: Request, res: Response) => {
        console.log('Get department manage');
        // const department_id: string = req.body.department_id;
        // const members_list: string[] = req.body.members_list;
        const edited_department = req.body;
        // members_list.push(res.locals.userId);
        console.log(edited_department);
        const department = await db.Department.findOne({_id: edited_department._id});
        if (!department || !edited_department) {
            console.log('Bad department manage');
            res.status(400).json({message: 'Insufficient information'});
        } else {
            // const pull_members_list = department.members_list.filter((m)=>!edited_department.members_list.includes(m));
            const pull_members_list = await db.User.find({
                _id: {$nin: edited_department.members_list.map((m: I.IDepProfile) => m._id)},
            });
            console.log(pull_members_list);
            await department!
                .updateOne({
                    department_name: edited_department.name,
                    admin: edited_department.admin,
                    short_name: edited_department.short_name,
                    members_list: edited_department
                })
                .then(async () => {
                    await db.User.updateOne({
                        $and: [{_id: department.admin._id}, {_id: {$ne: edited_department.admin._id}}],
                        role: {$nin: [I.UserRoles.SystemAdmin, I.UserRoles.Director]},
                    }, {role: I.UserRoles.Staff});
                    await db.User.updateMany({
                        _id: {$in: pull_members_list},
                        department: {$eq: department._id}
                    }, {$pull: {department: department._id}});
                    await db.User.updateMany({
                        _id: {$in: edited_department.members_list},
                        department: {$ne: department._id}
                    }, {$push: {department: department._id}});
                    await db.Chat.updateOne({_id: department!.linked_chat_id}, {
                        admin: edited_department.admin,
                        $push: {members_list: edited_department.members_list},
                        $pull: {members_list: pull_members_list}
                    });
                });

            res.status(200).json({message: 'Department edited'});
        }
    });

// Store connected users
    const users: { [key: string]: string } = {};
    const rooms: { [key: string]: string[] } = {};
    // function updateRooms(roomId?: string, ): void {
    //
    // }
    // await getChatRooms().then((value) => {rooms = value;});
    // function getChatSockets(chatId: string) {
    //
    // }
//const rooms: { [key: string]: string[] } = getChatRooms().then((dict): { [key: string]: string[] } => dict);

// Socket.IO connection
    io.use(verifySocketToken).on('connection', (socket) => {
        //console.log(rooms);
        console.log('A user connected:', socket.id);
        const userId = socket.handshake.auth.userId;
        //console.log(`Cookies are: ${socket.request.headers.cookie}`);
        const token = socket.handshake.auth.token;
        console.log(socket.handshake.auth);
        //console.log(socket.request.headers.cookie);
        users[userId] = socket.id;
        // Listen for new user joining
        socket.on('joinChat', async (chatId: string) => {
            console.log(`${userId} joined the chat ${chatId}`);
            socket.join(chatId);
            const chatMessages = await db.Message.find({
                chat_id: chatId,
            })
            socket.emit('chatMessageList', chatMessages);
            //const chat =
            // TODO: load last messages
            //users[userId] = socket.id;
            //addUser(socket.id, userId);
            //io.emit('userList', Object.values(users)); // Send updated user list to all clients
            //io.emit('message', `${userId} is online.`);
        });

        // Listen for chat messages
        socket.on('message', async (chatId: string, message: string) => {
            const sender = await db.getUserProfile(userId);
            console.log(sender);
            const chat = await db.Chat.findOne({_id: chatId}, {members_list: 1});
            console.log(socket.data);
            console.log(`${userId} has sent the message \'${escape(message)}\' in ${chatId}`);
            if (!chat) {
                io.emit('error', 'Invalid chat info');
            } else if (chat.members_list) {
                const chat_members = chat.members_list.map((mem) => users[mem]);
                let messageSavedId = "";
                const messageSaved = await new db.Message({
                    sender: sender!,
                    chat_id: chatId,
                    content: message,
                    seen_by: [userId],
                }).save().then((msg) => {
                    messageSavedId = msg._id.toString();
                    return msg;
                });
                const chatSaved = await db.Chat.findOneAndUpdate({_id: chatId}, {last_message: messageSaved});
                console.log(chatSaved);
                chatSaved!.last_message = messageSaved;
                io.to(chat_members).emit('message', messageSaved, chatSaved);
            }
        });

        socket.on('markSeen', async (message_id: string, chat_id: string) => {
            console.log('Mark seen invoked with params: ', message_id, chat_id);
            if (message_id && chat_id) {
                const seenMsg = await db.Message.findOne({_id: message_id});
                if (seenMsg) {
                    //console.log('SeenMsg:', seenMsg);
                    const msgsToUpdate = await db.Message.find({
                        createdAt: {$lte: seenMsg.createdAt},
                        chat_id: chat_id,
                        seen_by: {$not: {$eq: userId}}
                    });
                    console.log(seenMsg.content, msgsToUpdate);
                    if (msgsToUpdate.length > 0) {
                        msgsToUpdate!.forEach((msg) => msg.seen_by!.push(userId));
                        console.log(await db.Message.updateMany({_id: {$in: msgsToUpdate.map((m) => m._id)}}, {$push: {seen_by: userId}}));
                        const chat_members = (await db.getChatMembers(chat_id))!.map((mem) => users[mem])
                        console.log('chatmems: ', chat_members);
                        socket.to(chat_members).emit('seenMsgs', msgsToUpdate);
                    }
                }
            }
        });

        // Handle user disconnect
        socket.on('disconnect', () => {
            console.log(`${userId} has left the chat ${socket.id}`);
            delete users[socket.id];
            console.log(users);
            //io.emit('userList', Object.values(users));
            //io.emit('message', `${userId} has left the chat.`);
        });
    });
}

setUpServer().then(() => console.log('Done setUpServer'));

// Graceful shutdown function
const shutdown = async () => {
    console.log('Shutting down general server...');

    // Close all WebSocket connections
    await io.close(() => {
        console.log('WebSocket connections closed.');
    });

    // Close the HTTP server
    server.close(() => {
        console.log('General server closed.');
    });

    // DEV ONLY
    // await mongoose.connection.dropDatabase().then(() => {
    //     console.log('MongoDB database dropped');
    // });
    // Close the MongoDB connection
    await mongoose.disconnect().then(() => {
        console.log('Server disconnected from MongoDB');
    });

    // Exit the process
    process.exit(0);
};

// Handle shutdown signals
process.on('SIGINT', shutdown); // Ctrl+C
process.on('SIGTERM', shutdown); // Termination signal

server.listen(SERVER_PORT, () => {
    console.log(`Server is running on ${HOST_URL}:${SERVER_PORT}`);
});