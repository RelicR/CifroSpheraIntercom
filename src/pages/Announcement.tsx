import React, {useEffect, useReducer, useRef, useState} from 'react';
import {useForm} from 'react-hook-form';
import {useAccessTokenState} from "../providers/AuthContext";
import {api, setAuthForInterceptor} from '../utils/axiosConfig'
import {IAnnouncement, IDepProfile} from '../../types/generalTypes'
import {ModalAnnouncement} from '../components/ModalAnnouncement'
import {timeAgo} from "../utils/timeFormat"

type Action = {
    type: string;
    filter?: string;
    refFilter?: Filter;
}

type Filter = {
    dateStart?: Date;
    dateEnd?: Date;
    departments?: string[];
    tags?: string[];
}

export const Announcement: React.FC = () => {
    const [input, setInput] = useState<string>('');
    const [curDept, setCurDept] = useState<string | null>(null);
    const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
    const [filteredAnn, setFilteredAnn] = useState<IAnnouncement[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const context = useAccessTokenState();
    const [departments, setDepartments] = useState<IDepProfile[]>([]);
    const {getAccess} = context;
    const [filters, dispatchFilters] = useReducer(filtersReducer, {});
    const filtersRef = useRef<Filter>({});

    const {
        register, resetField, reset, setError, clearErrors, getValues, setValue, handleSubmit,
        formState: {errors, touchedFields, isValid}
    } = useForm({
        defaultValues: {
            dateStart: '',
            dateEnd: '',
            departments: ['all'],
            tags: [],
        },
        mode: 'onChange',
    });

    console.log(modalOpen);

    function filtersReducer(list: Filter, action: Action): Filter {
        console.log(list, action);
        if (action.type == 'replace' && action.refFilter) return action.refFilter;
        if (!action.filter) {
            filtersRef.current = {};
            return {};
        }
        let newList: Filter = {...list};
        switch (action.type) {
            case 'set-start': {
                newList.dateStart = action.filter ? new Date(action.filter) : undefined;
                filtersRef.current! = newList;
                return newList;
                break;
            }
            case 'set-end': {
                newList.dateEnd = new Date(action.filter);
                filtersRef.current! = newList;
                return newList;
                break;
            }
            case 'select-dep': {
                if (action.filter == 'all') {
                    newList.departments = [];
                } else if (newList.departments) {
                    newList.departments = newList.departments.includes(action.filter)
                        ? newList.departments.toSpliced(newList.departments.indexOf(action.filter), 1)
                        : newList.departments.concat(action.filter);
                } else newList.departments = [action.filter];
                filtersRef.current! = newList;
                return newList;
                break;
            }
            case 'select-tag': {
                if (newList.tags)
                    newList.tags = newList.tags.includes(action.filter)
                        ? newList.tags.toSpliced(newList.tags.indexOf(action.filter), 1)
                        : newList.tags.concat(action.filter);
                filtersRef.current! = newList;
                return newList;
                break;
            }
            default: {
                filtersRef.current! = newList;
                return newList;
                break;
            }
        }
    }

    useEffect(() => {
        dispatchFilters({
            type: `replace`,
            refFilter: filtersRef.current,
        });
    }, [filtersRef.current]);

    useEffect(() => {
        setAuthForInterceptor(context);
        getAnnouncements().then(() => console.log('Got announcements'));
        getDepartments().then(() => console.log('Got departments'));
    }, [context]);

    const getDepartments = async () => {
        const resp = await api.get('/department/list?mode=profile').then(
            function (response) {
                return response.data;
            }, function (error) {
                console.log(error);
            }
        );
        console.log(resp);
        console.log(resp);
        console.log(departments);
        console.log(departments.length);
        setDepartments(resp)
    }

    const getAnnouncements = async () => {
        const resp = await api.get('/announcement/list').then(
            function (response) {
                return response.data;
            }, function (error) {
                console.log(error);
            }
        );
        setAnnouncements(resp);
        setFilteredAnn(resp);
        console.log(resp);
        console.log(announcements);
    }

    const changeDate = (date: string, filter: string) => {
        dispatchFilters({
            type: `set-${filter}`,
            filter: date,
        });
        console.log(date, filter);
    }

    const changeDep = (depId: string) => {
        dispatchFilters({
            type: `select-dep`,
            filter: depId,
        });
        console.log(depId);
    }
    const onDateChange = (period: string, date: string) => {
        const {dateStart, dateEnd} = getValues();
        console.log(dateStart, dateEnd, period, date);
        if (period == 'start') {
            clearErrors('dateStart');
            if (dateEnd != '' && new Date(date) > new Date(dateEnd)) {
                setError('dateStart', {
                    type: 'value',
                    message: 'Дата начала должна быть меньше даты конца периода'
                });
                // resetField('dateStart');
            } else setValue("dateStart", date);
        } else {
            clearErrors('dateEnd');
            if (dateStart != '' && new Date(date) < new Date(dateStart)) {
                setError('dateEnd', {
                    type: 'value',
                    message: 'Дата конца должна быть больше даты начала периода'
                });
                // resetField('dateEnd');
            } else setValue("dateEnd", date);
        }
    }

    const filterAnnouncements = () => {
        let annToFilter = [...announcements];
        console.log('Filter Announcements', annToFilter);
        const {dateStart, dateEnd, departments, tags} = getValues();
        console.log(touchedFields);
        if (Object.keys(touchedFields).length != 0) {
            if (dateStart != '' || dateEnd != '') {
                const start = dateStart != '' ? new Date(dateStart) : null;
                const end = dateEnd != '' ? new Date(dateEnd) : null;
                annToFilter = annToFilter.filter(
                    (ann) =>
                        start && end
                            ? ann.createdAt! >= start && ann.createdAt! <= end
                            : start ? ann.createdAt! >= start : ann.createdAt! <= end!
                );
            }
            if (departments && departments.length > 0) {
                annToFilter = annToFilter.filter((ann) =>
                    departments.includes(ann.department._id));
            }
        }
        // if (filters.tags) {
        //
        // }
        console.log(annToFilter);
        setFilteredAnn(annToFilter);
    }

    const onSubmit = (data: Object) => {
        console.log(data);
        console.log(isValid);
        console.log(touchedFields);
        filterAnnouncements();
    }

    const onClickAll = () => {
        resetField("departments");
    }

    const onChangeDep = (depId: string) => {
        let chosenDep = getValues("departments");
        if (depId == 'all') {
            chosenDep = [];
        } else if (chosenDep.includes('all')) {
            chosenDep = [depId];
        } else {
            chosenDep = chosenDep.includes(depId) ? chosenDep.toSpliced(chosenDep.indexOf(depId), 1) : [...chosenDep, depId];
        }
        if (chosenDep.length == 0) resetField("departments");
        else setValue("departments", chosenDep);
    }

    return (
        <div className="main-container">
            <aside className={""}>
                <h2 className={"aside-header"}>Фильтры</h2>
                <div className={"p-4 flex-1 h-full"}>
                    <form onSubmit={handleSubmit(onSubmit)} className={"h-full overflow-y-auto"}>
                        <h3 className={"section-header"}>Даты</h3>
                        <div className="space-y-3">
                            <div className="flex flex-col items-center gap-3">
                                <div className="flex-1 w-full">
                                    <label htmlFor={"dateStart"}
                                           className={"block text-xs text-gray-500 mb-1"}>Начало</label>
                                    <input type="date" id="dateStart" className="date-picker text-sm w-full"
                                           {...register("dateStart")}
                                           onChange={(e) => {
                                               onDateChange('start', e.target.value)
                                           }}/>
                                    {errors.dateStart && (
                                        <span className={"error-span"}>{errors.dateStart.message}</span>)}
                                </div>
                                <div className="flex-1 w-full">
                                    <label htmlFor={"dateEnd"}
                                           className={"block text-xs text-gray-500 mb-1"}>Конец</label>
                                    <input type="date" id="dateEnd" className="date-picker text-sm w-full"
                                           {...register("dateEnd")}
                                           onChange={(e) => {
                                               onDateChange('end', e.target.value)
                                           }}/>
                                    {errors.dateEnd && (<span className={"error-span"}>{errors.dateEnd.message}</span>)}
                                </div>
                            </div>
                        </div>
                        <h3 className={"section-header"}>Отделы</h3>
                        <div className="space-y-2 dep-check">
                            <div className="flex items-center">
                                <label htmlFor="departments"
                                       className="flex items-center cursor-pointer text-sm w-full">
                                    <input type="checkbox" id="departments" className="filter-checkbox" value={'all'}
                                           {...register("departments")} onClick={(e) => {
                                        resetField("departments");
                                    }}/>
                                    Все
                                </label>
                            </div>
                            {departments && departments.length > 0 && departments.map((dep) => (
                                <div className="flex items-center" key={dep._id}>
                                    <label key={dep._id} htmlFor={"dep-" + dep.short_name.replace(' ', '-')}
                                           className="flex items-center cursor-pointer text-sm w-full">
                                        <input type="checkbox" id={"dep-" + dep.short_name.replace(' ', '-')}
                                               className="filter-checkbox" value={dep._id}
                                               {...register("departments")} onChange={(e) => onChangeDep(dep._id)}/>
                                        {dep.short_name}
                                    </label>
                                </div>
                            ))}
                        </div>
                        <div className={"side-section flex flex-col gap-2 items-center mt-4"}>
                            <button type={"submit"} className="rounded-button w-full">
                                Применить
                            </button>
                            <button className="rounded-button w-full" onClick={(e) => reset()}>
                                Сбросить
                            </button>
                        </div>
                    </form>
                </div>
            </aside>
            <main className={"main-window announcement"}>
                <div className={"flex items-center p-4 border-b border-gray-200"}>
                    <div className="flex-1">
                        <h1 className="text-xl font-semibold">Объявления</h1>
                    </div>
                    {
                        getAccess() > 2 && (
                            <button onClick={(e) => setModalOpen(true)}>
                                Создать объявление
                            </button>
                        )
                    }
                </div>
                {/*<button onClick={getAnnouncements}>Обновить список</button>*/}
                <div className="announcement-list">
                    {filteredAnn?.map((announcement, index) => (
                        <div
                            className={`announcement-card ${announcement._pinned && "pinned-announcement"}`}
                            key={index}>
                            <div className="flex items-start justify-between mb-3">
                                <div className={"flex items-center gap-3"}>
                                    <h3 className={"font-medium"}>
                                        {announcement.sender.display_name}
                                    </h3>
                                </div>
                                <div className={"flex items-center gap-3"}>
                                    <h3 className={"font-medium"}>
                                        {announcement.department.department_name}
                                    </h3>
                                </div>
                                <div>
                                    {
                                        timeAgo(announcement.createdAt!)
                                    }
                                </div>
                            </div>
                            <h2 className={"text-xl font-semibold mb-2"}>{announcement.subject}</h2>
                            <p className={"announcement-content"}>
                                {announcement.content!.split("\n").map((text, index) => (
                                    <React.Fragment key={index}>
                                        {text}
                                        <br/>
                                    </React.Fragment>
                                ))}
                            </p>
                        </div>
                    ))}
                </div>
            </main>
            {modalOpen && (
                <ModalAnnouncement
                    isOpen={modalOpen}
                    setOpen={setModalOpen}
                    setCreated={(status) => {
                        if (status) getAnnouncements();
                    }}/>
            )}
        </div>
    );
}