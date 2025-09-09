import React from 'react';
import ReactDOM from 'react-dom/client';
import { Home } from '@xad/ui';
import '@xad/ui/styles';
import './style.css';

const App = () => {
  return <Home />;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);