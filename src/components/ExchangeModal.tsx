import { useState } from "react";
import { Item } from "./ItemCard";

interface ExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetItem: Item;
  userItems: Item[];
  onSubmitExchange: (targetItemId: string, selectedItemIds: string[]) => void;
}

export function ExchangeModal({ isOpen, onClose, targetItem, userItems, onSubmitExchange }: ExchangeModalProps) {
  const [selectedItemId, setSelectedItemId] = useState<string>("");

  console.log('ExchangeModal rendered with:', { isOpen, targetItem: targetItem?.title, userItemsCount: userItems.length });
  
  // Safety check to prevent crashes if targetItem is missing
  if (!targetItem) {
    console.error('ExchangeModal: targetItem is missing');
    return null;
  }

  if (!isOpen) return null;
  
  const availableUserItems = userItems.filter(item => item.status === 'available');
  console.log('Available user items for exchange:', availableUserItems.length, availableUserItems);

  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId === selectedItemId ? "" : itemId);
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

  const handleClose = () => {
    setSelectedItemId("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Exchange Items - {targetItem.title}</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Seller's Item */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                👤 Seller's Item
              </h3>
              <div className="border-2 border-blue-200 rounded-lg p-3 bg-blue-50">
                <img 
                  src={targetItem.images[0]} 
                  alt={targetItem.title}
                  className="w-full h-32 object-cover rounded mb-3"
                />
                <h4 className="font-medium">{targetItem.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{targetItem.description}</p>
                <div className="text-xs text-gray-500">
                  <p>Owner: {targetItem.seller}</p>
                  <p>Condition: {targetItem.condition}</p>
                </div>
              </div>
              <div className="mt-3 p-3 bg-gray-100 rounded-lg">
                <p className="text-sm font-medium">This is the item you want to receive</p>
              </div>
            </div>

            {/* Your Items */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                🎒 Your Items
              </h3>
              {availableUserItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>You don't have any available items to exchange.</p>
                  <p>Add some items first!</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium mb-3">Select one item to offer:</p>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {availableUserItems.map((item) => (
                      <div 
                        key={item.id} 
                        className={`cursor-pointer border-2 rounded-lg p-3 transition-all hover:shadow-md ${
                          selectedItemId === item.id 
                            ? 'border-blue-500 bg-blue-50 shadow-md' 
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                        onClick={() => handleItemSelect(item.id)}
                      >
                        <div className="flex items-center gap-3">
                          <img 
                            src={item.images[0]} 
                            alt={item.title}
                            className="w-16 h-16 object-cover rounded-md"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.title}</h4>
                            <p className="text-xs text-gray-600">{item.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Condition: {item.condition}
                            </p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedItemId === item.id 
                              ? 'border-blue-500 bg-blue-500' 
                              : 'border-gray-400'
                          }`}>
                            {selectedItemId === item.id && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Exchange Preview */}
          {selectedItemId && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">You give:</p>
                  <p className="text-lg font-bold text-red-600">
                    {availableUserItems.find(item => item.id === selectedItemId)?.title}
                  </p>
                </div>
                <div className="text-2xl">⇄</div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">You get:</p>
                  <p className="text-lg font-bold text-green-600">{targetItem.title}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t flex justify-end gap-3">
          <button 
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            onClick={handleClose}
          >
            Cancel
          </button>
          <button 
            className={`px-4 py-2 rounded text-white ${
              selectedItemId 
                ? 'bg-blue-500 hover:bg-blue-600' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            onClick={handleSubmit}
            disabled={!selectedItemId}
          >
            Send Exchange Request
          </button>
        </div>
      </div>
    </div>
  );
}