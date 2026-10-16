import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProductListPage from './pages/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CategoryListPage from './pages/CategoryListPage';
import CategoryDetailPage from './pages/CategoryDetailPage';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<ProductListPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/categories" element={<CategoryListPage />} />
        <Route path="/categories/:slug" element={<CategoryDetailPage />} />
      </Route>
    </Routes>
  );
}

export default App;
