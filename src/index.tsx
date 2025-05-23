import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import {AuthProvider} from './providers/AuthContext';
// import {AuthContext, AuthProvider} from './providers/AuthContext';
import './styles.css';

// Create a root element for React to render into
//const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
const root = ReactDOM.createRoot(document.body as HTMLElement);

// Render the App component
root.render(
    <React.StrictMode>
        <AuthProvider>
            <App/>
        </AuthProvider>
    </React.StrictMode>
);