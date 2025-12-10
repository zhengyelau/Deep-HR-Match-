import React, { useState } from 'react';
import { ShoppingCart, X, CreditCard, CheckCircle2, Loader2 } from 'lucide-react';
import { Button, Card } from './UI';
import { MatchResult } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: MatchResult[];
  onProceed: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, items, onProceed }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  if (!isOpen) return null;

  const total = items.length * 10;

  const handlePayment = async () => {
    setIsProcessing(true);

    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsProcessing(false);
    setPaymentSuccess(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    onProceed();
    setPaymentSuccess(false);
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  if (paymentSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in p-4">
        <Card className="w-full max-w-md overflow-hidden shadow-2xl">
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300">
              <CheckCircle2 size={48} className="text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful</h3>
            <p className="text-slate-600">Redirecting to purchased candidates...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in p-4">
      <Card className="w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart size={20} className="text-blue-600"/> Checkout
          </h3>
          <button onClick={handleClose} disabled={isProcessing} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-200 rounded-full disabled:opacity-50 disabled:cursor-not-allowed">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <h4 className="font-semibold text-slate-700 mb-4 flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded">{items.length} items</span>
          </h4>
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.candidate.candidate_id} className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 flex items-center justify-center text-xs font-bold shadow-sm">
                      {item.candidate.first_name[0]}{item.candidate.last_name[0]}
                   </div>
                   <div className="flex flex-col">
                      <span className="font-medium text-slate-800">{item.candidate.first_name} {item.candidate.last_name}</span>
                      <span className="text-xs text-slate-500">{item.candidate.current_city}</span>
                   </div>
                </div>
                <span className="font-semibold text-slate-700">S$10.00</span>
              </div>
            ))}
            {items.length === 0 && <p className="text-slate-500 italic text-center py-4">No candidates selected.</p>}
          </div>
          
          <div className="border-t border-slate-200 mt-6 pt-4 space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>S${total}.00</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-slate-900 pt-2 border-t border-slate-100 mt-2">
              <span>Total</span>
              <span>S${total}.00</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <Button variant="secondary" onClick={handleClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            disabled={items.length === 0 || isProcessing}
            isLoading={isProcessing}
            className="px-6 bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Proceed to Payment
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};