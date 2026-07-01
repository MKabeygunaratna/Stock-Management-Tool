import { Tag } from 'lucide-react';
import NameCrudPage from '../components/common/NameCrudPage';
import { getBrands, createBrand, updateBrand, deleteBrand } from '../api/brands.api';

export default function Brands() {
  return (
    <NameCrudPage
      title="Brands"
      icon={Tag}
      api={{ list: getBrands, create: createBrand, update: updateBrand, remove: deleteBrand }}
    />
  );
}
