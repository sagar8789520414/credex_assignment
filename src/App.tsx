import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SpendForm from '@/components/SpendForm';
import AuditResults from '@/components/AuditResults';
import SharedResult from '@/components/SharedResult';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SpendForm />} />
        <Route path="/results/:id" element={<AuditResults />} />
        <Route path="/share/:id" element={<SharedResult />} />
      </Routes>
    </BrowserRouter>
  );
}
