import React from 'react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Plus, Minus } from 'lucide-react';

const QuantitySelector = ({ quantity, onQuantityChange, stockLimit = Infinity }) => {
  const handleDecrement = () => {
    onQuantityChange(Math.max(1, quantity - 1));
  };

  const handleIncrement = () => {
    onQuantityChange(Math.min(stockLimit, quantity + 1));
  };

  const handleInputChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (isNaN(value)) {
      onQuantityChange(0); // Or handle as an error, but 0 is safe for removal logic
    } else {
      onQuantityChange(Math.min(stockLimit, Math.max(0, value)));
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={handleDecrement}
        disabled={quantity <= 1}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Input
        type="number"
        value={quantity}
        onChange={handleInputChange}
        className="w-16 h-8 text-center"
        min="0"
        max={stockLimit}
      />
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={handleIncrement}
        disabled={quantity >= stockLimit}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default QuantitySelector;
