import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Item } from "./ItemCard";

interface ExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetItem: Item;
  userItems: Item[];
  onSubmitExchange: (targetItemId: string, selectedItemIds: string[]) => void;
}

export function ExchangeModalSimple({ isOpen, onClose, targetItem, userItems, onSubmitExchange }: ExchangeModalProps) {
  const [selectedItemId, setSelectedItemId] = useState<string>("");

  if (!targetItem) {
    console.error('ExchangeModal: targetItem is missing');
    return null;
  }

  const handleClose = () => {
    setSelectedItemId("");
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedItemId) {
      alert('Please select one item to exchange');
      return;
    }
    onSubmitExchange(targetItem.id, [selectedItemId]);
    setSelectedItemId("");
    onClose();
  };

  const availableUserItems = userItems.filter(item => item.status === 'available');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            Exchange for: {targetItem.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Target Item:</h3>
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium">{targetItem.title}</h4>
              <p className="text-sm text-gray-600">{targetItem.description}</p>
              <p className="text-sm">Owner: {targetItem.seller}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Your Items:</h3>
            {availableUserItems.length === 0 ? (
              <p className="text-gray-500">No available items to exchange</p>
            ) : (
              <div className="space-y-2">
                {availableUserItems.map((item) => (
                  <div 
                    key={item.id}
                    className={`p-3 border rounded-lg cursor-pointer ${
                      selectedItemId === item.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedItemId(item.id === selectedItemId ? "" : item.id)}
                  >
                    <h4 className="font-medium">{item.title}</h4>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!selectedItemId}
          >
            Send Exchange Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}