import React, { createContext, useState, useContext } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';

const DialogContext = createContext();

export const useDialog = () => useContext(DialogContext);

export const DialogProvider = ({ children }) => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  const showDialog = (title, message, onConfirm = null) => {
    setDialogState({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
  };

  const hideDialog = () => {
    setDialogState({ isOpen: false, title: '', message: '', onConfirm: null });
  };

  const handleConfirm = () => {
    if (dialogState.onConfirm) {
      dialogState.onConfirm();
    }
    hideDialog();
  };

  return (
    <DialogContext.Provider value={{ showDialog }}>
      {children}
      <Dialog open={dialogState.isOpen} onOpenChange={hideDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogState.title}</DialogTitle>
            <DialogDescription>
              {dialogState.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {dialogState.onConfirm && (
              <Button variant="outline" onClick={hideDialog}>Cancel</Button>
            )}
            <Button onClick={handleConfirm}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DialogContext.Provider>
  );
};
