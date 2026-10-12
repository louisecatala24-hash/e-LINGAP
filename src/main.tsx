import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';
const root = createRoot(document.getElementById('root')!);
const env = import.meta.env;
if (!env.VITE_FIREBASE_API_KEY || !env.VITE_FIREBASE_PROJECT_ID || !env.VITE_FIREBASE_APP_ID) {
  root.render(<main style={{padding:48,fontFamily:'sans-serif',maxWidth:760,margin:'auto'}}>
    <h1>DSWD Solo Parent Portal</h1><p>Academic portfolio prototype</p>
    <p>To run the portal, copy .env.example to .env.local and enter your own demo Firebase web configuration. Follow README.md for database setup.</p>
    <p>The database schema and fictional sample records are included in the repository.</p>
  </main>);
} else {
  import('./App.tsx').then(({default: App}) => root.render(<StrictMode><App /></StrictMode>));
}
