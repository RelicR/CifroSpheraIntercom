import mongoose, {Schema} from 'mongoose';
import * as I from '../../types/generalTypes';
import {UserRoles} from '../../types/generalTypes';

require('dotenv').config();

const serviceRoles = [UserRoles.Service, UserRoles.SystemAdmin, UserRoles.Director];

const profileSchema = new Schema<I.IUserProfile>({
    _id: String,
    display_name: {type: String},
    department: [{type: String}],
    role: {type: String, default: I.UserRoles.Staff},
    avatar: {type: String},
    status: {type: String, enum: ['active', 'inactive']},
});

const userSchema = new Schema<I.IUser>({
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    display_name: {type: String},
    department: [{type: String}],
    role: {type: String, default: I.UserRoles.Staff},
    avatar: {type: String},
    status: {type: String, enum: ['active', 'inactive'], default: 'inactive'}
});

const guestSchema = new Schema<I.IGuest>({
    user: {type: userSchema, required: true},
    login_href: {type: String},
    manager: [{type: profileSchema}]
});

const tokenSchema = new Schema<I.IToken>({
    user_id: {type: String, unique: true, required: true},
    refresh_token: {type: String, required: true, unique: true},
    expires: {type: Date, default: new Date(Date.now() + Number(process.env.TOKEN_EXPIRES!))},
});

// TODO: FILES_LIST
const messageSchema = new Schema<I.IMessage>({
    sender: {type: profileSchema, required: true},
    chat_id: {type: String, required: true},
    content: {type: String, required: true},
    reply_to: {type: String},
    forward_to: {type: String},
    is_deleted: {type: Boolean, default: false},
    seen_by: [{type: String}],
}, {timestamps: true});

// TODO: last_message_seen for each user
const chatSchema = new Schema<I.IChat>({
    chat_name: {type: String},
    chat_type: {type: String, enum: I.ChatType, required: true},
    admin: {type: profileSchema, default: {}},
    last_message: {type: messageSchema, required: false},
    members_list: [{type: String}],
    unread: {type: Number, default: 0}
}, {timestamps: true});

const depProfileSchema = new Schema<I.IDepProfile>({
    _id: String,
    department_name: String,
    short_name: String
})

const departmentSchema = new Schema<I.IDepartment>({
    department_name: {type: String, required: true},
    admin: {type: profileSchema, default: {}},
    short_name: {type: String},
    linked_chat_id: {type: String},
    members_list: [{type: profileSchema, required: true}],
    // parent_dep
});

// const chatMembersSchema = new Schema<>({
//     chat_id: { type: String, unique: true, required: true },
//     members_list: [{ type: String }],
// });


// TODO
// const fileSchema = new Schema<>({
//
// });

// TODO
// const chatFilesSchema = new Schema<>({
//
// });
// TODO
const announcementSchema = new Schema<I.IAnnouncement>({
    sender: {type: profileSchema, required: true},
    department: {type: depProfileSchema, required: true},
    subject: {type: String, required: true},
    content: {type: String, required: true},
    is_delayed: {type: Boolean, default: false},
    delayed_timestamp: {type: Date, default: new Date()},
    is_deleted: {type: Boolean, default: false},
    _pinned: {type: Boolean, default: false},
}, {timestamps: true});

// TODO
// const guestSchema = new Schema<>({
//
// });

// const sesSchema = new Schema<>({
//     userid: { type: String, required: true, unique: true },
//     token: { type: String, required: true },
// });

// const chatSchema = new Schema<>({
//     name: { type: String, required: true, unique: true },
//     members: { type: [String], default: [], required: true },
//     admin: { type: String, required: false, unique: false, default: 'none' },
// });

// export const dbUser = mongoose.model('User', userSchema);
//
// export const dbSession = mongoose.model('Session', sesSchema);
//
// export const dbChat = mongoose.model('Chat', chatSchema);

export const User = mongoose.model('User', userSchema);
export const Token = mongoose.model('Token', tokenSchema);
export const Chat = mongoose.model('Chat', chatSchema);
export const Message = mongoose.model('Message', messageSchema);
//export const ChatMem = mongoose.model('ChatMembers', chatMembersSchema);
export const Announcement = mongoose.model('Announcement', announcementSchema);
export const Department = mongoose.model('Department', departmentSchema);
export const Guest = mongoose.model('Guest', guestSchema);

export const getUserProfile = async (uid: string | string[]) => {
    return User.findOne({_id: {$in: uid}}, {
        _id: 1,
        display_name: 1,
        department: 1,
        role: 1,
        avatar: 1,
        status: 1,
    });
}

export const getUsersList = async (uid: string) => {
    return User.find({_id: {$ne: uid}, role: {$nin: [UserRoles.Service, UserRoles.Guest]}});
    // return User.find(
    //     {_id: {$ne: uid}, role: {$nin: [UserRoles.Service, UserRoles.Guest]}},
    //     {
    //         _id: 1,
    //         display_name: 1,
    //         department: 1,
    //         role: 1,
    //         avatar: 1,
    //         status: 1,
    //     });
}

export const getDepMembers = async (uid: string, depId: string) => {
    return User.find(
        {_id: {$ne: uid}, department: depId},
        {
            _id: 1,
            display_name: 1,
            department: 1,
            role: 1,
            avatar: 1,
            status: 1,
        });
}

export const getChatMembers = async (chatId: string) => {
    const chat = await Chat.findOne({_id: chatId});
    return chat!.members_list;
}

export const getDepList = async (uid: string, role: UserRoles) => {
    const depList = await Department.find({
        members_list: {$elemMatch: {_id: uid}}
    });
    return depList;
}

export const getHodDepList = async (uid: string, role: UserRoles) => {
    if (serviceRoles.includes(role)) {
        const depList = await Department.find({});
        return depList;
    } else {
        const depList = await Department.find({
            "admin._id": uid
        });
        return depList;
    }
}

export const getServDep = async (uid: string, role: UserRoles) => {
    //console.log(uid, role);
    // const depList = await Department.find({
    //     $or: [
    //         {
    //             $and: [
    //                 {"admin._id": uid}, {short_name: {$in: Object.keys(UserRoles)}}
    //             ]
    //         },
    //         {department_name: role}
    //     ]
    // });
    if (serviceRoles.includes(role)) {
        const depList = await Department.find({
            short_name: {$in: Object.keys(UserRoles)}
        });
        return depList;
    }
    else {
        const depList = await Department.find({
            $or: [
                {
                    $and: [
                        {"admin._id": uid}, {short_name: {$in: Object.keys(UserRoles)}}
                    ]
                },
                {department_name: role}
            ]
        });
        return depList;
    }
    //console.log(await Department.find({department_name: role}));
    // short_name: {$nin: Object.keys(UserRoles)}

}

export const getChatList = async (uid: string) => {
    let chat_list: I.IChat[] = (await Chat.find({members_list: uid}).sort({updatedAt: 'desc'})) as I.IChat[];
    for (let chat of chat_list) {
        const unread = (await Message.find({chat_id: chat._id, seen_by: {$not: {$eq: uid}}})).length;
        if (chat.chat_type == I.ChatType.Private) {
            const friend_id = chat.members_list!.filter((m) => m != uid)[0];
            const friend_name = (await getUserProfile(friend_id))!.display_name!;
            console.log('Friend_id: ', friend_id, friend_name);
            chat.chat_name = (await getUserProfile(friend_id))!.display_name!;
        }
        console.log(chat);
        chat.unread = unread;
        console.log('Chat with unread:', chat);
    }
    return chat_list;
}

export const getAnnList = async (uid: string, role: UserRoles) => {
    const user_deps = serviceRoles.includes(role) ? (await getHodDepList(uid, role))
            .concat(await getServDep(uid, role))
        : (await getDepList(uid, role))
            .concat(await getServDep(uid, role))
    console.log('User deps: ', user_deps);
    console.log(await getServDep(uid, role));
    const ann_list: I.IAnnouncement[] = (await Announcement.find({
        department: {$in: user_deps},
    }).sort({_pinned: 'desc', createdAt: 'desc'}));
    console.log('DB ann:', ann_list);
    return ann_list;
}
//export default {User, Token, Chat, Announcement, Department};