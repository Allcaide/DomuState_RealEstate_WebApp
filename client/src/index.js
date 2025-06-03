import React from 'react';
import ReactDOM from 'react-dom';

function App() {
  return <h1>Olá, mundo!</h1>;
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
