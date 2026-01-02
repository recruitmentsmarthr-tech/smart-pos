import React, { useState } from "react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Search, X, Filter } from "lucide-react";

const AdvancedSearch = ({ filters, setFilters, categories, fetchProducts }) => {
  const [dateSearchType, setDateSearchType] = useState("equal");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleReset = () => {
    const newFilters = {
      name: filters.name, // Keep the name filter
      category_id: "",
      sell_price_gt: "",
      sell_price_lt: "",
      buy_price_gt: "",
      buy_price_lt: "",
      quantity_gt: "",
      quantity_lt: "",
      total_sold_gt: "",
      total_sold_lt: "",
      arrival_date_eq: "",
      arrival_date_start: "",
      arrival_date_end: "",
    };
    setFilters(newFilters);
    //
  };

  const handleSearch = () => {
    fetchProducts();
  };

  const handleClearSearch = () => {
    setFilters(prevFilters => ({ ...prevFilters, name: "" }));
  };
  
  const handleFullReset = () => {
    setFilters({
      name: "",
      category_id: "",
      sell_price_gt: "",
      sell_price_lt: "",
      buy_price_gt: "",
      buy_price_lt: "",
      quantity_gt: "",
      quantity_lt: "",
      total_sold_gt: "",
      total_sold_lt: "",
      arrival_date_eq: "",
      arrival_date_start: "",
      arrival_date_end: "",
    });
    fetchProducts();
  }

  return (
    <div className="mb-4 flex items-center gap-2">
      <div className="relative flex-grow">
        <Input
          name="name"
          placeholder="Search by Product Name..."
          value={filters.name}
          onChange={handleInputChange}
          className="text-xs sm:text-sm h-9 pr-8 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        {filters.name && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
            onClick={handleClearSearch}
          >
            <X size={16} className="text-muted-foreground" />
          </Button>
        )}
      </div>
      <Button onClick={handleSearch} size="sm">
        <Search size={16} />
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter size={16} className="mr-2" />
            More Filters
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Advanced Filters</h4>
              <p className="text-sm text-muted-foreground">
                Narrow down your search results.
              </p>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-sm">Category</label>
                <select
                  name="category_id"
                  className="col-span-2 w-full p-2 border rounded-md text-xs sm:text-sm h-9"
                  value={filters.category_id}
                  onChange={handleInputChange}
                >
                  <option value="">All</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-sm">Sell Price</label>
                <div className="col-span-2 flex gap-1">
                  <Input name="sell_price_gt" type="number" placeholder="Min" value={filters.sell_price_gt} onChange={handleInputChange} className="h-9 text-xs" />
                  <Input name="sell_price_lt" type="number" placeholder="Max" value={filters.sell_price_lt} onChange={handleInputChange} className="h-9 text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-sm">Buy Price</label>
                <div className="col-span-2 flex gap-1">
                  <Input name="buy_price_gt" type="number" placeholder="Min" value={filters.buy_price_gt} onChange={handleInputChange} className="h-9 text-xs" />
                  <Input name="buy_price_lt" type="number" placeholder="Max" value={filters.buy_price_lt} onChange={handleInputChange} className="h-9 text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-sm">Quantity</label>
                <div className="col-span-2 flex gap-1">
                  <Input name="quantity_gt" type="number" placeholder="Min" value={filters.quantity_gt} onChange={handleInputChange} className="h-9 text-xs" />
                  <Input name="quantity_lt" type="number" placeholder="Max" value={filters.quantity_lt} onChange={handleInputChange} className="h-9 text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-sm">Sold</label>
                <div className="col-span-2 flex gap-1">
                  <Input name="total_sold_gt" type="number" placeholder="Min" value={filters.total_sold_gt} onChange={handleInputChange} className="h-9 text-xs" />
                  <Input name="total_sold_lt" type="number" placeholder="Max" value={filters.total_sold_lt} onChange={handleInputChange} className="h-9 text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                 <label className="text-sm">Arrival</label>
                <div className="col-span-2">
                  {dateSearchType === "equal" ? (
                    <Input name="arrival_date_eq" type="date" value={filters.arrival_date_eq} onChange={handleInputChange} className="h-9 text-xs" />
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Start Date</label>
                        <Input name="arrival_date_start" type="date" value={filters.arrival_date_start} onChange={handleInputChange} className="h-9 text-xs" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">End Date</label>
                        <Input name="arrival_date_end" type="date" value={filters.arrival_date_end} onChange={handleInputChange} className="h-9 text-xs" />
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end gap-2 mt-1">
                     <label className="flex items-center gap-1 cursor-pointer text-xs"><input type="radio" name="dateSearchType" value="equal" checked={dateSearchType === "equal"} onChange={() => setDateSearchType("equal")} />Eq</label>
                     <label className="flex items-center gap-1 cursor-pointer text-xs"><input type="radio" name="dateSearchType" value="between" checked={dateSearchType === "between"} onChange={() => setDateSearchType("between")} />Bw</label>
                  </div>
                </div>
              </div>
            </div>
             <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleReset}>
                    <X size={16} className="mr-2" />
                    Reset Filters
                </Button>
                <Button onClick={() => {
                  const popoverTrigger = document.querySelector('[aria-controls="radix-1"]');
                  if(popoverTrigger) popoverTrigger.click();
                  handleSearch();
                }}>
                    <Search size={16} className="mr-2" />
                    Apply
                </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <Button variant="ghost" size="sm" onClick={handleFullReset} className="text-muted-foreground">
        Reset All
      </Button>
    </div>
  );
};

export default AdvancedSearch;
