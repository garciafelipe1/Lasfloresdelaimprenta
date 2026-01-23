'use client';

import { useTranslations } from 'next-intl';
import React, { useState } from 'react';

interface SizeSelectorProps {
  sizes: string[];
}

const SizeSelector: React.FC<SizeSelectorProps> = ({ sizes }) => {
  const t = useTranslations('categories-products.products.sizes');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (size: string) => {
    setSelectedSize(size);
    setIsOpen(false);
  };

  const displayCurrentSelection = () => {
    if (selectedSize) {
      return `${t('label')}: ${getDisplaySize(selectedSize)}`;
    }
    return `${t('label')}: ${t('select')}`;
  };

  const getDisplaySize = (size: string) => {
    switch (size.toUpperCase()) {
      case 'S':
        return 'S';
      case 'M':
        return 'M';
      case 'L':
        return 'L';
      case 'XL':
        return 'XL';
      default:
        return size;
    }
  };

  return (
    <div>
      
      <div className="relative">
        <button
          type="button"
          className="w-full rounded-md border border-secondary bg-secondary py-2 px-3 text-left text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary"
          onClick={toggleOpen}
        >
          {displayCurrentSelection()}
        </button>
        {isOpen && (
          <div className="absolute z-10 mt-1 w-full rounded-md bg-secondary shadow-lg">
            <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
              {sizes.map((size) => (
                <div
                  key={size}
                  onClick={() => handleOptionClick(size)}
                  className="block px-4 py-2 text-sm text-primary hover:bg-primary/30 cursor-pointer"
                  role="menuitem"
                >
                  {getDisplaySize(size)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SizeSelector;