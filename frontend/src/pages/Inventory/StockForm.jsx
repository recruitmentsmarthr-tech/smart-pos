import React, { useState, useEffect, useRef } from "react";
import api from "../../api";
import { Upload, X, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Popover, PopoverTrigger, PopoverContent } from "~/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "~/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "~/components/ui/command";
import { cn } from "~/lib/utils";

const StockForm = ({ onSuccess, onCancel, isEditMode = false, item = null }) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const fileInputRef = useRef(null);
  const [existingImagePreviews, setExistingImagePreviews] = useState([]); // Stores { src: string } for existing images
  const [selectedFiles, setSelectedFiles] = useState([]); // This will store { file: File, src: string }
  const [imagesToDelete, setImagesToDelete] = useState([]); // Stores relative paths of images to delete
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "", price: "", cost_price: "", quantity: "", category_id: "", description: "", arrival_date: ""
  });
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    api.get("/categories/").then(res => setCategories(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (isEditMode && item) {
      setFormData({
        name: item.name || "",
        price: item.price || "",
        cost_price: item.cost_price || "",
        quantity: item.quantity || "",
        category_id: item.category?.id || "",
        description: item.description || "",
        arrival_date: item.arrival_date ? new Date(item.arrival_date).toISOString().split('T')[0] : ""
      });
      if (item.images) {
        setExistingImagePreviews(item.images.map(img => ({ src: `http://localhost:8000/${img}` })));
      } else {
        setExistingImagePreviews([]);
      }
      setImagesToDelete([]);
      setSelectedFiles([]);
    }
  }, [isEditMode, item]);

  const previewsForDisplay = [...existingImagePreviews, ...selectedFiles];

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        src: URL.createObjectURL(file)
      }));
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeImage = (previewToRemove) => {
    if (previewToRemove.file) { // If it's a new file (has a file object)
      URL.revokeObjectURL(previewToRemove.src); // Revoke blob URL
      setSelectedFiles(prev => prev.filter(p => p.src !== previewToRemove.src));
    } else { // It's an existing image (no file object)
      const imageUrl = previewToRemove.src.substring(previewToRemove.src.indexOf("static_images"));
      setImagesToDelete(prev => [...prev, imageUrl]);
      setExistingImagePreviews(prev => prev.filter(p => p.src !== previewToRemove.src)); // Remove from existing images immediately
    }
  };
  
  const clearFiles = (e) => {
    e.preventDefault();
    existingImagePreviews.forEach(preview => {
      const imageUrl = preview.src.substring(preview.src.indexOf('static_images'));
      setImagesToDelete(prev => [...prev, imageUrl]);
    });
    setExistingImagePreviews([]);
    
    selectedFiles.forEach(preview => URL.revokeObjectURL(preview.src));
    setSelectedFiles([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category_id) return alert("Please select a category.");
    setLoading(true);

    const data = new FormData();
    data.append('name', formData.name);
    data.append('price', formData.price);
    data.append('cost_price', formData.cost_price || '');
    data.append('quantity', formData.quantity);
    data.append('category_id', formData.category_id);
    data.append('description', formData.description || '');
    if (formData.arrival_date) {
        data.append('arrival_date', new Date(formData.arrival_date).toISOString());
    }

    try {
        let response;
        if (isEditMode) {
            data.append('images_to_delete', JSON.stringify(imagesToDelete));
            selectedFiles.forEach(preview => data.append("files", preview.file));
            response = await api.put(`/stock/${item.id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        } else {
            selectedFiles.forEach(preview => data.append("files", preview.file));
            response = await api.post("/stock/", data);
        }
        onSuccess(response.data);
        setImagesToDelete([]);
        setSelectedFiles([]);
    } catch (err) {
        console.error(err);
        const serverMsg = err.response?.data?.detail || `Failed to ${isEditMode ? 'update' : 'create'} stock item.`;
        setErrorMessage(serverMsg);
        setErrorDialogOpen(true);
    } finally {
        setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="grid gap-2 py-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="quantity">Stock Quantity</Label>
            <Input id="quantity" name="quantity" type="number" value={formData.quantity} onChange={handleChange} required />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="price">Price</Label>
            <Input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cost_price">Cost Price (Optional)</Label>
            <Input id="cost_price" name="cost_price" type="number" step="0.01" value={formData.cost_price} onChange={handleChange} />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Category</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {formData.category_id
                  ? categories.find((category) => category.id === formData.category_id)?.name
                  : "Select category..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Search category..." />
                <CommandEmpty>No category found.</CommandEmpty>
                <CommandGroup>
                  {categories.map((category) => (
                    <CommandItem
                      key={category.id}
                      value={category.name}
                      onSelect={(currentValue) => {
                        const selectedCategory = categories.find(c => c.name.toLowerCase() === currentValue.toLowerCase());
                        if (selectedCategory) {
                          setFormData({ ...formData, category_id: selectedCategory.id });
                        }
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          formData.category_id === category.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {category.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-1">
          <Label htmlFor="arrival_date">Arrival Date</Label>
          <Input id="arrival_date" name="arrival_date" type="date" value={formData.arrival_date} onChange={handleChange} />
        </div>
        <div className="space-y-1">
          <Label>Images</Label>
          <div className="border-2 border-dashed border-muted rounded-lg p-2 relative flex flex-col items-center justify-between gap-2 min-h-[8rem]">
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            {previewsForDisplay.length === 0 ? (
              <Button type="button" variant="outline" onClick={() => fileInputRef.current.click()}>
                <Upload size={16} className="mr-2" />
                Select Images
              </Button>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-2 w-full max-h-[100px] overflow-y-auto pr-2">
                  {previewsForDisplay.map((previewItem) => (
                    <div key={previewItem.src} className="relative">
                      <img src={previewItem.src} className="w-full h-full object-cover rounded-md border" />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => removeImage(previewItem)}
                        className="absolute -top-2 -right-2 rounded-full h-6 w-6 p-0"
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current.click()}>
                    <Upload size={14} className="mr-2" />
                    Add More
                  </Button>
                  <Button type="button" size="sm" variant="destructive" onClick={clearFiles}>
                    <X size={14} className="mr-2" />
                    Clear All
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" value={formData.description} onChange={handleChange} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>
              {errorMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setErrorDialogOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StockForm;