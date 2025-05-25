// src/hooks/use-pagination.ts
import { useState } from 'react';

interface UsePaginationProps {
  totalItems: number;
  initialPage?: number;
  itemsPerPage?: number;
}

interface UsePaginationReturn {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  setItemsPerPage: (count: number) => void;
  pageItems: number[];
  startItem: number;
  endItem: number;
}

export function usePagination({
  totalItems,
  initialPage = 1,
  itemsPerPage = 10
}: UsePaginationProps): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPageState, setItemsPerPageState] = useState(itemsPerPage);
  
  const totalPages = Math.ceil(totalItems / itemsPerPageState);
  
  // Ensure current page is valid when total changes
  if (totalPages > 0 && currentPage > totalPages) {
    setCurrentPage(totalPages);
  }
  
  const nextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };
  
  const prevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };
  
  const goToPage = (page: number) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  };
  
  const setItemsPerPage = (count: number) => {
    setItemsPerPageState(count);
    // Reset to first page when changing items per page
    setCurrentPage(1);
  };
  
  // Calculate page item indices
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPageState + 1;
  const endItem = Math.min(startItem + itemsPerPageState - 1, totalItems);
  
  // Generate array of items for current page
  const pageItems = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  return {
    currentPage,
    totalPages,
    itemsPerPage: itemsPerPageState,
    nextPage,
    prevPage,
    goToPage,
    setItemsPerPage,
    pageItems,
    startItem,
    endItem
  };
}

