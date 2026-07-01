import { Layers } from 'lucide-react';
import NameCrudPage from '../components/common/NameCrudPage';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/categories.api';

export default function Categories() {
  return (
    <NameCrudPage
      title="Categories"
      icon={Layers}
      api={{ list: getCategories, create: createCategory, update: updateCategory, remove: deleteCategory }}
    />
  );
}
