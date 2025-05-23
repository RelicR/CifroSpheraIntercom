import React from 'react';

export const Home: React.FC = () => {

    return (
        <div className="main-container flex-col justify-center p-4 gap-2">
            <section className="flex-col justify-center rounded-lg bg-secondary p-6" id="services">
                <h2>Наши Услуги</h2>
                <p>Мы предлагаем широкий спектр услуг в области информационных технологий, включая разработку
                    программного обеспечения, ИТ-консалтинг и цифровизацию бизнес-процессов.</p>
            </section>

            <section className="flex-col justify-center rounded-lg bg-secondary p-6" id="about">
                <h2>О Нас</h2>
                <p>Цифросфера — это команда профессионалов, стремящихся предоставить лучшие решения для вашего бизнеса.
                    Мы работаем над тем, чтобы сделать технологии доступными и эффективными.</p>
            </section>

            <section className="flex-col justify-center rounded-lg bg-secondary p-6" id="contact">
                <h2>Контакты</h2>
                <p>Свяжитесь с нами по электронной почте: infoul@cifrosfera.com.</p>
            </section>
        </div>
    );
}