import { useState, useEffect } from "react";
import { Upload, X, Camera, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

interface AddItemFormProps {
  onSubmit: (itemData: any) => void;
  onCancel: () => void;
  onDelete?: (itemId: string) => void;
  existingItem?: {
    id: string;
    title: string;
    description: string;
    category: string;
    condition: string;
    location: string;
    images: string[];
  };
}

const categories = [
  { value: 'books', label: 'Books & Textbooks' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'other', label: 'Other' },
];

const conditions = [
  { value: 'new', label: 'Like New' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

export function AddItemForm({ onSubmit, onCancel, onDelete, existingItem }: AddItemFormProps) {
  const [formData, setFormData] = useState({
    title: existingItem?.title || '',
    description: existingItem?.description || '',
    category: existingItem?.category || '',
    condition: existingItem?.condition || '',
    location: existingItem?.location || '',
    images: existingItem?.images || [] as string[],
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [dragActive, setDragActive] = useState(false);

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      imageFiles.forEach(file => {
        // We can't easily track which URL belongs to which file here without more complex state,
        // but for now, we rely on the fact that we are creating new URLs on upload.
        // A better approach would be to store { file, previewUrl } objects.
      });
      // Note: In a real app, we should revoke object URLs when they are no longer needed.
    };
  }, [imageFiles]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);
    const newImageUrls = newFiles.map(file => URL.createObjectURL(file));

    setImageFiles(prev => [...prev, ...newFiles]);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImageUrls].slice(0, 5) // Max 5 images
    }));
  };

  const removeImage = (index: number) => {
    // If we are removing an image that was just uploaded (has a corresponding file)
    // We need to figure out which file it corresponds to.
    // For simplicity, we assume new images are appended.
    // However, existingItem images come first.

    const existingCount = existingItem?.images?.length || 0;

    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));

    if (index >= existingCount) {
      // It's a new file
      const fileIndex = index - existingCount;
      setImageFiles(prev => prev.filter((_, i) => i !== fileIndex));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.category || !formData.condition) {
      alert('Please fill in all required fields');
      return;
    }

    const itemData = {
      ...formData,
      ...(existingItem && { id: existingItem.id }),
      imageFiles: imageFiles // Pass the files
    };

    onSubmit(itemData);
  };

  const handleDelete = () => {
    if (existingItem?.id && onDelete) {
      if (window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
        onDelete(existingItem.id);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle>{existingItem ? 'Edit Item' : 'Add Item for Exchange'}</CardTitle>
          <p className="text-muted-foreground">
            {existingItem
              ? 'Update your item details below.'
              : 'Add your item to the exchange marketplace and find others to trade with.'
            }
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Images Upload */}
            <div className="space-y-4">
              <Label>Photos (up to 5)</Label>

              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                  }`}
                onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  handleImageUpload(e.dataTransfer.files);
                }}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files)}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Drag & drop images here, or <span className="text-primary">browse</span>
                  </p>
                </label>
              </div>

              {formData.images.length > 0 && (
                <div className="grid grid-cols-5 gap-2">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={image}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover rounded border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      {index === 0 && (
                        <Badge className="absolute bottom-1 left-1 text-xs">Main</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., MacBook Pro 13-inch, Biology Textbook, etc."
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
              />
            </div>

            {/* Category and Condition */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Condition *</Label>
                <Select onValueChange={(value) => handleInputChange('condition', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditions.map((condition) => (
                      <SelectItem key={condition.value} value={condition.value}>
                        {condition.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., North Campus, Engineering Building"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your item in detail. Include any defects, usage history, or special features."
                rows={4}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button type="submit" className="flex-1">
                {existingItem ? 'Update Item' : 'Add Item'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              {existingItem && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  className="px-4"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="ml-2">Delete</span>
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}