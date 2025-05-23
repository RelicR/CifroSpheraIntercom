export function timeAgo(dateString: string | Date): string {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const now = new Date();

    const diffMs = now.getTime() - date.getTime(); // разница в миллисекундах
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 60) {
        // return `${minutes} ${pluralize(minutes, ['минуту', 'минуты', 'минут'])} назад`;
        return `${minutes} м.`;
    }

    if (hours < 24) {
        return `${hours} ч.`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear()
    ) {
        return "Вчера";
    }

    // Если дата в текущем году — показываем "дд месяц время"
    if (date.getFullYear() === now.getFullYear()) {
        const day = date.toLocaleDateString(undefined, {day: 'numeric'});
        const month = date.toLocaleDateString(undefined, {month: 'long'});
        const time = date.toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit'});
        return `${day} ${month} ${time}`;
    }

    // Иначе — показываем "дд.мм.гггг"
    const day = date.toLocaleDateString(undefined, {day: '2-digit'});
    const month = date.toLocaleDateString(undefined, {month: '2-digit'});
    const year = date.toLocaleDateString(undefined, {year: 'numeric'});

    return `${day}.${month}.${year}`;
}

// Функция для правильного склонения слов
export function pluralize(n: number, titles: [string, string, string]): string {
    const cases = [2, 0, 1, 1, 1, 2];
    return titles[(n % 100 > 4 && n % 100 < 20) ? 2 : cases[n % 10 < 5 ? n % 10 : 5]];
}