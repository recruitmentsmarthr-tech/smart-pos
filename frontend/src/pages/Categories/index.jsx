import React, { useState, useEffect } from "react";
import api from "../../api";
import { ArrowLeft, Trash2, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "~/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

const CategoriesIndex = () => {
  const [categories, setCategories] = useState([]);
  const [newCat, setNewCat] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const navigate = useNavigate();

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories/");
      setCategories(res.data);
    } catch (err) { 
      console.error("Fetch failed:", err); 
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleCreate = async () => {
    if (!newCat.trim()) {
      alert("Please type a category name first.");
      return;
    }
    try {
      await api.post("/categories/", { name: newCat });
      setNewCat("");
      fetchCategories();
    } catch (err) {
      const detail = err.response?.data?.detail || "Check backend connection";
      alert(`Error: ${detail}`);
    }
  };
  
  const handleDelete = async (catId) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await api.delete(`/categories/${catId}`);
        fetchCategories();
      } catch (err) {
        const detail = err.response?.data?.detail || "Failed to delete category.";
        alert(`Error: ${detail}`);
      }
    }
  };
  
  const handleUpdate = async () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      alert("Category name cannot be empty.");
      return;
    }
    try {
      await api.put(`/categories/${editingCategory.id}`, { name: editingCategory.name });
      setIsEditDialogOpen(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (err) {
      const detail = err.response?.data?.detail || "Failed to update category.";
      alert(`Error: ${detail}`);
    }
  };

  const openEditDialog = (category) => {
    setEditingCategory({ ...category });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="h-full w-full p-4 sm:p-6 md:p-8 lg:p-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Categories</h1>
        <Button variant="outline" onClick={() => navigate("/inventory")}>
          <ArrowLeft size={16} className="mr-2" /> Back to Inventory
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <Input 
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          placeholder="Enter new category name..." 
          className="flex-1"
        />
        <Button onClick={handleCreate}>Add Category</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-y-auto max-h-[calc(100vh-22rem)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(cat)}>
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)}>
                          <Trash2 size={16} className="text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="2" className="h-24 text-center">
                      No categories found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <div className="grid gap-4 py-4">
              <Input
                value={editingCategory.name}
                onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                placeholder="Category name"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoriesIndex;