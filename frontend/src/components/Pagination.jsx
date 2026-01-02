import React, { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ page, setPage, totalCount, limit }) => {
  const totalPages = Math.ceil(totalCount / limit);
  const [jumpToPage, setJumpToPage] = useState('');

  const handleJumpToPage = (e) => {
    e.preventDefault();
    const pageNum = parseInt(jumpToPage, 10);
    if (pageNum >= 1 && pageNum <= totalPages) {
      setPage(pageNum);
      setJumpToPage('');
    }
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    const halfPagesToShow = Math.floor(maxPagesToShow / 2);

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      if (page > halfPagesToShow + 2) {
        pageNumbers.push('...');
      }

      let start = Math.max(2, page - halfPagesToShow);
      let end = Math.min(totalPages - 1, page + halfPagesToShow);

      if (page <= halfPagesToShow + 1) {
        end = maxPagesToShow - 1;
      }
      if (page >= totalPages - halfPagesToShow) {
        start = totalPages - maxPagesToShow + 2;
      }

      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }

      if (page < totalPages - halfPagesToShow - 1) {
        pageNumbers.push('...');
      }
      pageNumbers.push(totalPages);
    }

    return pageNumbers.map((num, index) => (
      <Button
        key={index}
        variant={num === page ? 'solid' : 'outline'}
        size="sm"
        onClick={() => typeof num === 'number' && setPage(num)}
        disabled={typeof num !== 'number'}
        className={num === page ? 'bg-primary text-primary-foreground' : ''}
      >
        {num}
      </Button>
    ));
  };

  return (
    <div className="flex items-center justify-between py-4">
      <div className="text-xs sm:text-sm text-muted-foreground">
        Total {totalCount} items
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(page - 1)}
          disabled={page <= 1}
          className="text-xs sm:text-sm"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        {renderPageNumbers()}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages}
          className="text-xs sm:text-sm"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
        <form onSubmit={handleJumpToPage} className="flex items-center space-x-2">
          <Input
            type="number"
            min="1"
            max={totalPages}
            placeholder="Page..."
            value={jumpToPage}
            onChange={(e) => setJumpToPage(e.target.value)}
            className="w-20 text-xs sm:text-sm"
          />
          <Button type="submit" variant="outline" size="sm" className="text-xs sm:text-sm">
            Go
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Pagination;