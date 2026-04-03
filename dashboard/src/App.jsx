import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Sessions from './pages/Sessions';
import Chats from './pages/Chats';
import Contacts from './pages/Contacts';
import Groups from './pages/Groups';
import Status from './pages/Status';
import Webhooks from './pages/Webhooks';
import Docs from './pages/Docs';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="sessions" element={<Sessions />} />
            <Route path="chats" element={<Chats />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="groups" element={<Groups />} />
            <Route path="status" element={<Status />} />
            <Route path="webhooks" element={<Webhooks />} />
            <Route path="docs" element={<Docs />} />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
