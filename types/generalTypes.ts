export enum UserRoles {
    Service = "Service",
    Director = "Генеральный директор",
    SystemAdmin = "Системный администратор",
    HeadOfDepartment = "Глава отдела",
    Staff = "Сотрудник",
    Guest = "Клиент"
}

export enum UserStatus {
    Online = "Online",
    Offline = "Offline",
    Away = "Away"
}

export enum ChatType {
    Private = "Private",
    Group = "Group",
    Department = "Department",
}

export interface IUserProfile {
    _id: string;
    display_name?: string;
    department?: string[];
    role?: UserRoles;
    avatar?: string[];
    status?: UserStatus,
}

export interface IUser extends IUserProfile {
    username: string;
    password: string;
}

export interface IGuest {
    _id: string;
    user: IUser;
    login_href: string;
    manager?: IUserProfile[];
}

export interface IToken {
    _id: string;
    user_id: string;
    refresh_token: string;
    expires?: Date
}

// TODO: FILES_LIST
export interface IMessage {
    _id: string;
    sender: IUserProfile;
    chat_id: string;
    content: string;
    reply_to?: string;
    forward_to?: string;
    is_deleted?: boolean;
    seen_by?: string[];
    createdAt?: Date;
    _seen?: boolean;
    _delivered?: boolean;
}
//timestamp?: Date;

// TODO: last_message_seen for each user
export interface IChat {
    _id: string;
    chat_name?: string;
    chat_type: ChatType;
    admin?: IUserProfile;
    last_message?: IMessage;
    members_list?: string[];
    unread?: number;
}

export interface IDepProfile {
    _id: string;
    department_name: string;
    short_name: string;
}

export interface IDepartment {
    _id: string;
    department_name: string;
    admin: IUserProfile;
    short_name?: string;
    linked_chat_id?: string;
    members_list: IUserProfile[];
}

export interface IAnnouncement {
    _id: string;
    sender: IUserProfile;
    department: IDepProfile;
    subject: string;
    content: string;
    timestamp?: Date;
    is_delayed?: boolean;
    delayed_timestamp?: Date;
    is_deleted?: boolean;
    _pinned?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}



//
// export interface IUser {
//     username: string;
//     password: string;
//     display_name?: string;
//     department?: string[];
//     role?: UserRoles;
//     avatar?: string[];
//     status?: UserStatus,
// }
//
// export interface IToken {
//     user_id: string;
//     refresh_token: string;
//     expires?: Date
// }
//
// // TODO: FILES_LIST
// export interface IMessage {
//     sender_id: string;
//     chat_id: string;
//     content: string;
//     reply_to?: string;
//     forward_to?: string;
//     is_deleted?: boolean;
// }
// //timestamp?: Date;
//
// // TODO: last_message_seen for each user
// export interface IChat {
//     chat_name: string;
//     chat_type: ChatType;
//     admin_id?: string;
//     last_message?: IMessage;
//     members_list?: string[];
// }
//
// export interface IDepartment {
//     department_name: string;
//     admin_id: string;
//     short_name?: string;
//     linked_chat_id?: string;
//     members_list: string[];
// }
//
// export interface IAnnouncement {
//     sender_id: string;
//     department_id: string;
//     subject: string;
//     content: string;
//     timestamp?: Date;
//     is_delayed?: boolean;
//     delayed_timestamp?: Date;
//     is_deleted?: boolean;
// }

